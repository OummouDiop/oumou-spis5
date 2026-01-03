import { SensorData } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Backend response now matches frontend format
interface BackendSensorData {
  id: number;
  zone_id: string;
  timestamp: number;
  moisture: number;
  temperature: number;
  humidity: number;
  soilMoisture10cm: number;
  soilMoisture30cm: number;
  soilMoisture60cm: number;
  light: number;
  windSpeed: number;
  rainfall: boolean;
  rainfallIntensity: 'light' | 'moderate' | 'heavy' | 'none';
  created_at: string;
}

export async function fetchZoneHistory(zoneId: string): Promise<SensorData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/history?zone_id=${zoneId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const backendData: BackendSensorData[] = await response.json();
    
    // Backend data is now in the correct format - just return it
    return backendData.map(d => ({
      timestamp: d.timestamp,
      moisture: d.moisture,
      temperature: d.temperature,
      humidity: d.humidity,
      soilMoisture10cm: d.soilMoisture10cm,
      soilMoisture30cm: d.soilMoisture30cm,
      soilMoisture60cm: d.soilMoisture60cm,
      light: d.light,
      windSpeed: d.windSpeed,
      rainfall: d.rainfall,
      rainfallIntensity: d.rainfallIntensity
    }));
  } catch (error) {
    console.error('Error fetching zone history:', error);
    return [];
  }
}

export async function sendSensorData(zoneId: string, data: {
  humidity: number;
  temperature: number;
  soil_moisture: number;
  soil_moisture_10cm?: number;
  soil_moisture_30cm?: number;
  soil_moisture_60cm?: number;
  light?: number;
  wind_speed?: number;
  rainfall?: boolean;
  rainfall_intensity?: 'light' | 'moderate' | 'heavy' | 'none';
  pump_was_active?: boolean;
}): Promise<{ pump: boolean; message: string } | void> {
  try {
    const response = await fetch(`${API_BASE_URL}/send-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone_id: zoneId,
        ...data
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending sensor data:', error);
  }
}
