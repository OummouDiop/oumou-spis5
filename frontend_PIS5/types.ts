export enum CropType {
  CORN = 'Maïs',
  WHEAT = 'Blé',
  TOMATO = 'Tomate',
  VINEYARD = 'Vigne'
}

export interface SensorData {
  timestamp: number;
  moisture: number; // %
  temperature: number; // Celsius
  humidity: number; // %
  soilMoisture10cm: number; // %
  soilMoisture30cm: number; // %
  soilMoisture60cm: number; // %
  light: number; // lux
  windSpeed: number; // km/h
  rainfall: boolean; // true/false
  rainfallIntensity: 'light' | 'moderate' | 'heavy' | 'none';
}

export interface Zone {
  id: string;
  name: string;
  cropType: CropType;
  area: number; // Hectares
  isValveOpen: boolean;
  sensorHistory: SensorData[];
  currentReading: SensorData;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}

export interface WeatherCondition {
  condition: 'Sunny' | 'Cloudy' | 'Rainy';
  ambientTemp: number;
}

export interface SimulationState {
  zones: Zone[];
  weather: WeatherCondition;
  isPlaying: boolean;
  simulationSpeed: number; // 1x, 2x, etc.
}

export type IrrigationAction = 'START' | 'STOP';