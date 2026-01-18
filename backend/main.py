from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db
from models import SensorData, SensorDataCreate, IrrigationDecision, ValveState, ValveToggleRequest, ValveToggleResponse
from irrigation_logic import irrigation_decision
import joblib
import numpy as np
import os

# Plus besoin de créer les tables avec MongoDB

# Variable globale pour stocker la météo forcée
forced_weather = {"condition": None, "rain_intensity": None}

# Variable globale pour gérer la pause de la simulation backend
from datetime import datetime, timedelta
simulation_control = {
    "paused": False,
    "pause_until": None,
    "manual_mode": False
}

# Charger le modèle de prédiction au démarrage
import os
MODEL_PATH = os.path.join(os.path.dirname(__file__), "soil_moisture_model_v2.pkl")
print(f"📂 Chemin du modèle: {MODEL_PATH}")
print(f"📂 Chemin absolu: {os.path.abspath(MODEL_PATH)}")
print(f"✅ Fichier existe: {os.path.exists(MODEL_PATH)}")

soil_moisture_pipeline = None

try:
    if os.path.exists(MODEL_PATH):
        soil_moisture_pipeline = joblib.load(MODEL_PATH)
        # Le pipeline est un dict avec scaler + model + metadata
        if isinstance(soil_moisture_pipeline, dict):
            print(f"✅ Pipeline de prédiction chargé: version {soil_moisture_pipeline.get('version', 'unknown')}")
        else:
            print(f"✅ Modèle de prédiction chargé avec succès !")
    else:
        print(f"❌ Fichier modèle non trouvé: {MODEL_PATH}")
except Exception as e:
    print(f"❌ Erreur lors du chargement du modèle: {e}")
    import traceback
    traceback.print_exc()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




# ---------- ROUTES ----------

@app.get("/")
def home():
    return {"message": "IoT Irrigation Backend Running"}



@app.post("/send-data", response_model=IrrigationDecision)
def receive_sensor_data(data: SensorDataCreate):
    global simulation_control
    
    # Préparer le document à insérer
    from datetime import datetime, timedelta
    record_dict = {
        "zone_id": data.zone_id,
        "humidity": data.humidity,
        "temperature": data.temperature,
        "soil_moisture": data.soil_moisture,
        "soil_moisture_10cm": data.soil_moisture_10cm or data.soil_moisture * 0.9,
        "soil_moisture_30cm": data.soil_moisture_30cm or data.soil_moisture,
        "soil_moisture_60cm": data.soil_moisture_60cm or data.soil_moisture * 1.1,
        "light": data.light or 450.0,
        "wind_speed": data.wind_speed or 8.0,
        "rainfall": data.rainfall,
        "rainfall_intensity": data.rainfall_intensity,
        "created_at": datetime.utcnow(),
        "source": "manual" if simulation_control.get("manual_mode") else "auto"
    }
    result = db["sensor_data"].insert_one(record_dict)
    record_id = result.inserted_id

    # Decision based on soil moisture + previous pump state + rainfall
    decision = irrigation_decision(data.soil_moisture, data.pump_was_active, data.rainfall)

    # Mettre à jour l'état de la valve dans la base de données
    valve_state = db["valve_states"].find_one({"zone_id": data.zone_id})
    if not valve_state:
        db["valve_states"].insert_one({"zone_id": data.zone_id, "is_open": decision['pump']})
    else:
        db["valve_states"].update_one({"zone_id": data.zone_id}, {"$set": {"is_open": decision['pump']}})

    return decision


# Nouvelle route pour la simulation manuelle
@app.post("/send-manual-data", response_model=IrrigationDecision)
def receive_manual_data(data: SensorDataCreate):
    global simulation_control
    
    # Activer le mode manuel et mettre en pause pendant 1 minute
    simulation_control["manual_mode"] = True
    simulation_control["paused"] = True
    simulation_control["pause_until"] = datetime.utcnow() + timedelta(seconds=60)
    
    # Traiter les données manuelles
    return receive_sensor_data(data)


# Route pour vérifier si la simulation doit être en pause
@app.get("/simulation-status")
def get_simulation_status():
    global simulation_control
    
    # Vérifier si la pause est terminée
    if simulation_control["paused"] and simulation_control["pause_until"]:
        if datetime.utcnow() >= simulation_control["pause_until"]:
            simulation_control["paused"] = False
            simulation_control["manual_mode"] = False
            simulation_control["pause_until"] = None
    
    # Récupérer les dernières données pour synchroniser la simulation
    latest_data = db["sensor_data"].find_one(sort=[("created_at", -1)])
    valve_state = db["valve_states"].find_one({"zone_id": "zone-1"})
    
    return {
        "paused": simulation_control["paused"],
        "manual_mode": simulation_control["manual_mode"],
        "resume_time": simulation_control["pause_until"].isoformat() if simulation_control["pause_until"] else None,
        "latest_data": {
            "soil_moisture_10cm": latest_data.get("soil_moisture_10cm", 45) if latest_data else 45,
            "soil_moisture_30cm": latest_data.get("soil_moisture_30cm", 55) if latest_data else 55,
            "soil_moisture_60cm": latest_data.get("soil_moisture_60cm", 65) if latest_data else 65,
            "temperature": latest_data.get("temperature", 25) if latest_data else 25,
            "humidity": latest_data.get("humidity", 60) if latest_data else 60,
            "pump_active": valve_state.get("is_open", False) if valve_state else False
        } if latest_data else None
    }


@app.get("/history")
def get_history(zone_id: str = None):
    query = {}
    if zone_id:
        query["zone_id"] = zone_id
    # Trier par created_at décroissant pour avoir les plus récents en premier
    records = list(db["sensor_data"].find(query).sort("created_at", -1).limit(100))
    result = []
    for r in records:
        created_at = r.get("created_at")
        # Conversion du champ created_at en timestamp (ms)
        timestamp = None
        if created_at:
            try:
                # Pour les objets datetime natifs
                timestamp = int(created_at.timestamp() * 1000)
            except Exception:
                # Pour les chaînes ISO (au cas où)
                from dateutil import parser
                try:
                    dt = parser.isoparse(str(created_at))
                    timestamp = int(dt.timestamp() * 1000)
                except Exception:
                    timestamp = None
        result.append({
            "id": str(r.get("_id")),
            "zone_id": r.get("zone_id"),
            "timestamp": timestamp,
            "moisture": r.get("soil_moisture"),
            "temperature": r.get("temperature"),
            "humidity": r.get("humidity"),
            "soilMoisture10cm": r.get("soil_moisture_10cm", r.get("soil_moisture", 0) * 0.9),
            "soilMoisture30cm": r.get("soil_moisture_30cm", r.get("soil_moisture")),
            "soilMoisture60cm": r.get("soil_moisture_60cm", r.get("soil_moisture", 0) * 1.1),
            "light": r.get("light", 450.0),
            "windSpeed": r.get("wind_speed", 8.0),
            "rainfall": r.get("rainfall"),
            "rainfallIntensity": r.get("rainfall_intensity"),
            "created_at": str(created_at) if created_at else None
        })
    return result



@app.post("/toggle-valve", response_model=ValveToggleResponse)
def toggle_valve(request: ValveToggleRequest):
    """
    Contrôle manuel de la vanne d'irrigation pour une zone.
    Active ou désactive la pompe/électrovanne.
    """
    valve_state = db["valve_states"].find_one({"zone_id": request.zone_id})
    if not valve_state:
        db["valve_states"].insert_one({"zone_id": request.zone_id, "is_open": request.valve_open})
    else:
        db["valve_states"].update_one({"zone_id": request.zone_id}, {"$set": {"is_open": request.valve_open}})

    status = "ouverte" if request.valve_open else "fermee"
    action = "IRRIGATION ACTIVEE" if request.valve_open else "IRRIGATION ARRETEE"

    return ValveToggleResponse(
        zone_id=request.zone_id,
        valve_open=request.valve_open,
        message=f"{action} - Vanne {status} pour {request.zone_id}"
    )



@app.get("/valve-state/{zone_id}")
def get_valve_state(zone_id: str):
    """
    Récupère l'état actuel de la vanne pour une zone.
    """
    valve_state = db["valve_states"].find_one({"zone_id": zone_id})
    if not valve_state:
        return {
            "zone_id": zone_id,
            "valve_open": False,
            "message": "Aucun état trouvé - vanne fermée par défaut"
        }
    return {
        "zone_id": valve_state.get("zone_id"),
        "valve_open": valve_state.get("is_open", False),
        "updated_at": str(valve_state.get("updated_at")) if valve_state.get("updated_at") else None
    }

@app.post("/set-weather")
def set_weather(condition: str):
    global forced_weather
    
    if condition.lower() == 'auto':
        forced_weather = {"condition": None, "rain_intensity": None}
        return {"message": "Météo en mode automatique", "condition": "auto"}
    elif condition.lower() == 'sunny':
        forced_weather = {"condition": "sunny", "rain_intensity": None}
        return {"message": "☀️ Temps forcé : Ensoleillé", "condition": "sunny"}
    elif condition.lower() == 'cloudy':
        forced_weather = {"condition": "cloudy", "rain_intensity": None}
        return {"message": "☁️ Temps forcé : Nuageux", "condition": "cloudy"}
    elif condition.lower() == 'rainy':
        forced_weather = {"condition": "rainy", "rain_intensity": "moderate"}
        return {"message": "🌧️ Temps forcé : Pluvieux", "condition": "rainy"}
    else:
        return {"error": "Condition invalide"}

@app.get("/get-weather")
def get_weather():
    return forced_weather


def get_soil_moisture_prediction(zone_id: str):
    """
    Retourne la prédiction du modèle pour l'humidité du sol.
    Utilise les 5 derniers points de données (24h d'historique).
    """
    if soil_moisture_pipeline is None:
        return {
            "prediction": None,
            "error": "Modèle non disponible",
            "confidence": None
        }
    
    try:
        # Récupérer les 5 derniers points (les plus récents d'abord)
        records = list(db["sensor_data"].find({"zone_id": zone_id}).sort("created_at", -1).limit(5))
        
        if len(records) < 5:
            return {
                "prediction": None,
                "error": f"Pas assez de données historiques ({len(records)}/5 points)",
                "confidence": None
            }
        
        # Inverser pour avoir l'ordre chronologique (plus ancien → plus récent)
        records = records[::-1]
        
        # Extraire les features (10 capteurs par point)
        features_list = []
        for record in records:
            point_features = [
                float(record.get("humidity", 0)),
                float(record.get("temperature", 0)),
                float(record.get("soil_moisture", 0)),
                float(record.get("soil_moisture_10cm", 0)),
                float(record.get("soil_moisture_30cm", 0)),
                float(record.get("soil_moisture_60cm", 0)),
                float(record.get("light", 0)),
                float(record.get("wind_speed", 0)),
                float(record.get("rainfall", 0)) if isinstance(record.get("rainfall"), (int, float)) else (1.0 if record.get("rainfall") else 0.0),
                float(record.get("rainfall_intensity", 0)) if isinstance(record.get("rainfall_intensity"), (int, float)) else 0.0,
            ]
            features_list.extend(point_features)
        
        # Convertir en array (50 features total : 5 points × 10 capteurs)
        X = np.array(features_list).reshape(1, -1)
        
        # Faire la prédiction selon le format du pipeline
        if isinstance(soil_moisture_pipeline, dict):
            # Nouveau format avec scaler
            scaler = soil_moisture_pipeline['scaler']
            model = soil_moisture_pipeline['model']
            X_scaled = scaler.transform(X)
            prediction = model.predict(X_scaled)[0]
        else:
            # Ancien format (modèle seul)
            prediction = soil_moisture_pipeline.predict(X)[0]
        
        # Calculer une confiance approximative basée sur la variance des prédictions
        confidence = None
        if isinstance(soil_moisture_pipeline, dict) and 'model' in soil_moisture_pipeline:
            model = soil_moisture_pipeline['model']
            if hasattr(model, 'estimators_'):
                # Pour RandomForest, calculer la variance entre les arbres
                try:
                    predictions = [tree.predict(X_scaled if isinstance(soil_moisture_pipeline, dict) else X)[0] 
                                 for tree in model.estimators_[:50]]  # Utiliser 50 arbres pour la vitesse
                    variance = np.std(predictions)
                    # Confidence inversement proportionnelle à la variance (max 100%)
                    confidence = float(max(0, min(100, 100 - variance)))
                except:
                    pass
        
        return {
            "prediction": float(round(prediction, 2)),
            "error": None,
            "confidence": confidence,
            "num_samples_used": len(records)
        }
        
    except Exception as e:
        return {
            "prediction": None,
            "error": str(e),
            "confidence": None
        }


@app.get("/predict-soil-moisture/{zone_id}")
def predict_soil_moisture(zone_id: str):
    """
    Retourne la prédiction de l'humidité du sol pour les prochaines heures.
    Utilise les 5 derniers points (24h d'historique).
    """
    return get_soil_moisture_prediction(zone_id)

