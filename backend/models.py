
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

# Modèles Pydantic pour MongoDB
class SensorData(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    zone_id: str = "zone-1"
    humidity: float
    temperature: float
    soil_moisture: float
    soil_moisture_10cm: Optional[float] = None
    soil_moisture_30cm: Optional[float] = None
    soil_moisture_60cm: Optional[float] = None
    light: Optional[float] = None
    wind_speed: Optional[float] = None
    rainfall: Optional[bool] = False
    rainfall_intensity: Optional[str] = "none"
    created_at: Optional[datetime] = None

class ValveState(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    zone_id: str
    is_open: bool = False
    updated_at: Optional[datetime] = None


# ---------- Pydantic Models ----------

class SensorDataCreate(BaseModel):
    zone_id: str = "zone-1"
    humidity: float
    temperature: float
    soil_moisture: float
    soil_moisture_10cm: float | None = None
    soil_moisture_30cm: float | None = None
    soil_moisture_60cm: float | None = None
    light: float | None = None
    wind_speed: float | None = None
    rainfall: bool = False
    rainfall_intensity: Literal['light', 'moderate', 'heavy', 'none'] = 'none'
    pump_was_active: bool = False  # État précédent de la pompe

class SensorDataResponse(BaseModel):
    id: int
    zone_id: str
    timestamp: int  # milliseconds
    moisture: float
    temperature: float
    humidity: float
    soilMoisture10cm: float
    soilMoisture30cm: float
    soilMoisture60cm: float
    light: float
    windSpeed: float
    rainfall: bool
    rainfallIntensity: str
    created_at: str

    class Config:
        from_attributes = True

class IrrigationDecision(BaseModel):
    pump: bool
    message: str

class ValveToggleRequest(BaseModel):
    zone_id: str
    valve_open: bool

class ValveToggleResponse(BaseModel):
    zone_id: str
    valve_open: bool
    message: str
