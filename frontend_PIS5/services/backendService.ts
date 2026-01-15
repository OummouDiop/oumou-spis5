import { Zone, CropType, WeatherCondition, SensorData } from '../types';
import { fetchZoneHistory } from './apiService';

const API_BASE_URL = 'http://127.0.0.1:8000';

type Listener = (zones: Zone[], weather: WeatherCondition) => void;

class BackendService {
  private zones: Zone[] = [];
  private weather: WeatherCondition = { condition: 'Sunny', ambientTemp: 25 };
  private listeners: Listener[] = [];
  private intervalId: number | null = null;
  private isRunning = false;
  private pollRate = 3000; // Poll backend every 3 seconds

  constructor() {
    this.initializeZones();
    this.start();
  }

  private async initializeZones() {
    // Initialize with default zones
    this.zones = [
      {
        id: 'zone-1',
        name: 'Champ Principal',
        cropType: CropType.CORN,
        area: 12.5,
        isValveOpen: false,
        sensorHistory: [],
        currentReading: {
          timestamp: Date.now(),
          moisture: 0,
          temperature: 0,
          humidity: 0,
          soilMoisture10cm: 0,
          soilMoisture30cm: 0,
          soilMoisture60cm: 0,
          light: 0,
          windSpeed: 0,
          rainfall: false,
          rainfallIntensity: 'none'
        },
        status: 'OPTIMAL'
      }
    ];

    // Fetch initial data
    await this.fetchBackendData();
  }

  private async fetchBackendData() {
    try {
      console.log('🔄 [BackendService] Fetching data from backend...');
      
      // Fetch history for each zone
      for (const zone of this.zones) {
        // Fetch valve state
        const valveResponse = await fetch(`${API_BASE_URL}/valve-state/${zone.id}`);
        const valveData = await valveResponse.json();
        const isValveOpen = valveData.valve_open || false;
        console.log(`💧 [BackendService] Valve state for ${zone.id}: ${isValveOpen ? 'OPEN (Irrigation active)' : 'CLOSED (Irrigation inactive)'}`);
        
        const history = await fetchZoneHistory(zone.id);
        console.log(`📊 [BackendService] Received ${history.length} records for ${zone.id}`);
        
        if (history.length > 0) {
          // Update zone with backend data
          // IMPORTANT: history[0] est le plus récent (ordre décroissant du backend)
          const currentReading = history[0];
          console.log('📡 [BackendService] Latest reading:', {
            temp: currentReading.temperature,
            humidity: currentReading.humidity,
            soil10: currentReading.soilMoisture10cm,
            soil30: currentReading.soilMoisture30cm,
            soil60: currentReading.soilMoisture60cm,
            timestamp: new Date(currentReading.timestamp).toLocaleTimeString()
          });
          
          // Determine status based on moisture
          let status: Zone['status'] = 'OPTIMAL';
          if (currentReading.moisture < 30) status = 'WARNING';
          if (currentReading.moisture < 15) status = 'CRITICAL';
          if (currentReading.moisture > 90) status = 'WARNING';

          // Update weather based on latest sensor data
          this.weather.ambientTemp = currentReading.temperature;
          if (currentReading.rainfall) {
            this.weather.condition = 'Rainy';
          } else if (currentReading.light > 500) {
            this.weather.condition = 'Sunny';
          } else if (currentReading.light > 200) {
            this.weather.condition = 'Cloudy';
          }

          // Update zone - CRÉER UN NOUVEAU TABLEAU pour que React détecte le changement
          const zoneIndex = this.zones.findIndex(z => z.id === zone.id);
          if (zoneIndex !== -1) {
            const updatedZone = {
              ...this.zones[zoneIndex],
              currentReading,
              sensorHistory: history.reverse(), // Inverser pour avoir du plus ancien au plus récent
              status,
              isValveOpen  // Ajouter l'état de la valve
            };
            this.zones = [
              ...this.zones.slice(0, zoneIndex),
              updatedZone,
              ...this.zones.slice(zoneIndex + 1)
            ];
          }
        }
      }

      console.log('✅ [BackendService] Data updated, notifying listeners...');
      this.notify();
    } catch (error) {
      console.error('❌ [BackendService] Error fetching backend data:', error);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    // Send immediate initial state (send copies to avoid accidental mutation)
    listener(this.zones.map(z => ({ ...z, currentReading: { ...z.currentReading } })), { ...this.weather });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public start() {
    if (this.isRunning) {
      console.log('⚠️ [BackendService] Already running');
      return;
    }
    this.isRunning = true;
    console.log(`🚀 [BackendService] Starting polling every ${this.pollRate}ms`);
    this.intervalId = window.setInterval(() => this.fetchBackendData(), this.pollRate);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  public async toggleValve(zoneId: string) {
    // Toggle locally first for immediate UI feedback
    const zone = this.zones.find(z => z.id === zoneId);
    const newState = !zone?.isValveOpen;
    
    this.zones = this.zones.map(z => {
      if (z.id === zoneId) {
        return { ...z, isValveOpen: newState };
      }
      return z;
    });
    this.notify();

    // Send valve command to backend
    try {
      const response = await fetch(`${API_BASE_URL}/toggle-valve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zone_id: zoneId, 
          valve_open: newState 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vanne contrôlée:', result.message);
      } else {
        console.error('❌ Erreur lors du contrôle de la vanne');
      }
    } catch (error) {
      console.error('❌ Erreur de connexion au backend:', error);
      // Revert local state on error
      this.zones = this.zones.map(z => {
        if (z.id === zoneId) {
          return { ...z, isValveOpen: !newState };
        }
        return z;
      });
      this.notify();
    }
  }

  public async setWeather(condition: 'Sunny' | 'Cloudy' | 'Rainy') {
    try {
      // Map UI condition to backend format
      const backendCondition = condition.toLowerCase();
      
      console.log(`🌦️ Setting weather to: ${condition} (${backendCondition})`);
      
      const response = await fetch(`${API_BASE_URL}/set-weather?condition=${backendCondition}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Weather set:', result.message);
        
        // Update local weather for immediate UI feedback
        this.weather.condition = condition;
        if (condition === 'Rainy') this.weather.ambientTemp = 20;
        if (condition === 'Sunny') this.weather.ambientTemp = 30;
        if (condition === 'Cloudy') this.weather.ambientTemp = 24;
        this.notify();
      } else {
        console.error('❌ Failed to set weather');
      }
    } catch (error) {
      console.error('❌ Error setting weather:', error);
    }
  }

  public async getSoilMoisturePrediction(zoneId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/predict-soil-moisture/${zoneId}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`🔮 [BackendService] Soil moisture prediction for ${zoneId}:`, data);
        return data;
      } else {
        console.error('❌ Failed to get prediction');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting prediction:', error);
      return null;
    }
  }

  // Notify all listeners with immutable copies so React detects updates
  private notify() {
    try {
      const zonesCopy = this.zones.map(z => ({ ...z, currentReading: { ...z.currentReading }, sensorHistory: Array.isArray(z.sensorHistory) ? z.sensorHistory.map(h => ({ ...h })) : [] }));
      const weatherCopy = { ...this.weather };
      this.listeners.forEach(l => l(zonesCopy, weatherCopy));
    } catch (err) {
      console.error('❌ [BackendService] notify error:', err);
    }
  }
}

export const backendService = new BackendService();
