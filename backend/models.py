from sqlalchemy import Column, Integer, Float, DateTime, String, Boolean
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Literal

from database import Base

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String, default="zone-1")
    humidity = Column(Float)
    temperature = Column(Float)
    soil_moisture = Column(Float)
    soil_moisture_10cm = Column(Float, nullable=True)
    soil_moisture_30cm = Column(Float, nullable=True)
    soil_moisture_60cm = Column(Float, nullable=True)
    light = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    rainfall = Column(Boolean, default=False)
    rainfall_intensity = Column(String, default="none")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ValveState(Base):
    __tablename__ = "valve_states"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String, unique=True, index=True)
    is_open = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


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
