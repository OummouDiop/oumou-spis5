from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db
from models import SensorData, SensorDataCreate, IrrigationDecision, ValveState, ValveToggleRequest, ValveToggleResponse
from irrigation_logic import irrigation_decision

# Plus besoin de créer les tables avec MongoDB

# Variable globale pour stocker la météo forcée
forced_weather = {"condition": None, "rain_intensity": None}

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
    return {"message": "IoT Irrigation Backend Running ✔"}



@app.post("/send-data", response_model=IrrigationDecision)
def receive_sensor_data(data: SensorDataCreate):
    # Préparer le document à insérer
    from datetime import datetime
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
        "created_at": datetime.utcnow()
    }
    result = db["sensor_data"].insert_one(record_dict)
    record_id = result.inserted_id

    # Decision based on soil moisture + previous pump state
    decision = irrigation_decision(data.soil_moisture, data.pump_was_active)

    # Mettre à jour l'état de la valve dans la base de données
    valve_state = db["valve_states"].find_one({"zone_id": data.zone_id})
    if not valve_state:
        db["valve_states"].insert_one({"zone_id": data.zone_id, "is_open": decision['pump']})
    else:
        db["valve_states"].update_one({"zone_id": data.zone_id}, {"$set": {"is_open": decision['pump']}})

    return decision

    # Decision based on soil moisture + previous pump state
    decision = irrigation_decision(data.soil_moisture, data.pump_was_active)
    
    # Mettre à jour l'état de la valve dans la base de données
    valve_state = db.query(ValveState).filter(ValveState.zone_id == data.zone_id).first()
    if not valve_state:
        valve_state = ValveState(zone_id=data.zone_id, is_open=decision['pump'])
        db.add(valve_state)
    else:
        valve_state.is_open = decision['pump']
    db.commit()

    return decision



@app.get("/history")
def get_history(zone_id: str = None):
    query = {}
    if zone_id:
        query["zone_id"] = zone_id
    records = list(db["sensor_data"].find(query).sort("_id", -1).limit(100))
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

    status = "ouverte" if request.valve_open else "fermée"
    action = "💦 IRRIGATION ACTIVÉE" if request.valve_open else "🛑 IRRIGATION ARRÊTÉE"

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

