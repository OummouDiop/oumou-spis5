from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import SensorData, SensorDataCreate, IrrigationDecision, ValveState, ValveToggleRequest, ValveToggleResponse
from irrigation_logic import irrigation_decision

# Create DB tables
Base.metadata.create_all(bind=engine)

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


# Dependency: DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- ROUTES ----------

@app.get("/")
def home():
    return {"message": "IoT Irrigation Backend Running ✔"}


@app.post("/send-data", response_model=IrrigationDecision)
def receive_sensor_data(data: SensorDataCreate, db: Session = Depends(get_db)):

    # Save to database with all fields
    record = SensorData(
        zone_id=data.zone_id,
        humidity=data.humidity,
        temperature=data.temperature,
        soil_moisture=data.soil_moisture,
        soil_moisture_10cm=data.soil_moisture_10cm or data.soil_moisture * 0.9,
        soil_moisture_30cm=data.soil_moisture_30cm or data.soil_moisture,
        soil_moisture_60cm=data.soil_moisture_60cm or data.soil_moisture * 1.1,
        light=data.light or 450.0,
        wind_speed=data.wind_speed or 8.0,
        rainfall=data.rainfall,
        rainfall_intensity=data.rainfall_intensity
    )
    db.add(record)
    db.commit()
    db.refresh(record)

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
def get_history(zone_id: str = None, db: Session = Depends(get_db)):
    query = db.query(SensorData)
    if zone_id:
        query = query.filter(SensorData.zone_id == zone_id)
    
    records = query.order_by(SensorData.created_at.desc()).limit(100).all()
    
    # Convert to frontend format
    return [
        {
            "id": r.id,
            "zone_id": r.zone_id,
            "timestamp": int(r.created_at.timestamp() * 1000),
            "moisture": r.soil_moisture,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "soilMoisture10cm": r.soil_moisture_10cm or r.soil_moisture * 0.9,
            "soilMoisture30cm": r.soil_moisture_30cm or r.soil_moisture,
            "soilMoisture60cm": r.soil_moisture_60cm or r.soil_moisture * 1.1,
            "light": r.light or 450.0,
            "windSpeed": r.wind_speed or 8.0,
            "rainfall": r.rainfall,
            "rainfallIntensity": r.rainfall_intensity,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]


@app.post("/toggle-valve", response_model=ValveToggleResponse)
def toggle_valve(request: ValveToggleRequest, db: Session = Depends(get_db)):
    """
    Contrôle manuel de la vanne d'irrigation pour une zone.
    Active ou désactive la pompe/électrovanne.
    """
    # Récupérer ou créer l'état de la vanne pour cette zone
    valve_state = db.query(ValveState).filter(ValveState.zone_id == request.zone_id).first()
    
    if not valve_state:
        # Créer un nouvel état si n'existe pas
        valve_state = ValveState(zone_id=request.zone_id, is_open=request.valve_open)
        db.add(valve_state)
    else:
        # Mettre à jour l'état existant
        valve_state.is_open = request.valve_open
    
    db.commit()
    db.refresh(valve_state)
    
    # TODO: Intégration matérielle - Contrôler le GPIO/relais
    # import RPi.GPIO as GPIO
    # GPIO.output(VALVE_PIN, GPIO.HIGH if request.valve_open else GPIO.LOW)
    
    status = "ouverte" if request.valve_open else "fermée"
    action = "💦 IRRIGATION ACTIVÉE" if request.valve_open else "🛑 IRRIGATION ARRÊTÉE"
    
    return ValveToggleResponse(
        zone_id=request.zone_id,
        valve_open=request.valve_open,
        message=f"{action} - Vanne {status} pour {request.zone_id}"
    )


@app.get("/valve-state/{zone_id}")
def get_valve_state(zone_id: str, db: Session = Depends(get_db)):
    """
    Récupère l'état actuel de la vanne pour une zone.
    """
    valve_state = db.query(ValveState).filter(ValveState.zone_id == zone_id).first()
    
    if not valve_state:
        # Retourner état par défaut si non trouvé
        return {
            "zone_id": zone_id,
            "valve_open": False,
            "message": "Aucun état trouvé - vanne fermée par défaut"
        }
    
    return {
        "zone_id": valve_state.zone_id,
        "valve_open": valve_state.is_open,
        "updated_at": valve_state.updated_at.isoformat()
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

