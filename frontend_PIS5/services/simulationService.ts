/**
 * ⚠️ FICHIER OBSOLÈTE - NE PAS UTILISER ⚠️
 * 
 * Ce fichier générait des données de simulation LOCALES dans le navigateur.
 * Il a été remplacé par backendService.ts qui récupère les vraies données
 * depuis le backend Python (http://127.0.0.1:8000).
 * 
 * Ce fichier est conservé uniquement comme référence.
 * Utilisez backendService.ts à la place.
 */

import { Zone, CropType, WeatherCondition, SensorData } from '../types';

// ❌ ANCIEN CODE - Données de simulation locales (ne plus utiliser)
// Initial Mock Data
const INITIAL_ZONES: Zone[] = [
  {
    id: 'field1',
    name: 'Champ Principal',
    cropType: CropType.CORN,
    area: 12.5,
    isValveOpen: false,
    sensorHistory: [],
    currentReading: { 
      timestamp: Date.now(), 
      moisture: 45, 
      temperature: 24, 
      humidity: 60,
      soilMoisture10cm: 42,
      soilMoisture30cm: 47,
      soilMoisture60cm: 52,
      light: 450,
      windSpeed: 8.5,
      rainfall: false,
      rainfallIntensity: 'none'
    },
    status: 'OPTIMAL'
  }
];

type Listener = (zones: Zone[], weather: WeatherCondition) => void;

// ❌ Service de simulation locale - remplacé par backendService
class SimulationService {
  private zones: Zone[] = JSON.parse(JSON.stringify(INITIAL_ZONES));
  private weather: WeatherCondition = { condition: 'Sunny', ambientTemp: 25 };
  private listeners: Listener[] = [];
  private intervalId: number | null = null;
  private isRunning = false;
  private tickRate = 3000; // Update every 3 seconds (chaque tick = 30 minutes simulées)

  constructor() {
    // ❌ DÉSACTIVÉ - Ne génère plus de données locales
    // this.generateInitialHistory();
    // this.start();
    console.warn('⚠️ simulationService est obsolète. Utilisez backendService à la place.');
  }

  // ❌ DÉSACTIVÉ - Générait un historique de données fictives
  // Pour avoir un historique, utilisez les vraies données du backend
  private generateInitialHistory() {
    /* DÉSACTIVÉ - CODE COMMENTÉ
    const now = Date.now();
    const hoursBack = 24;
    const pointsPerHour = 1; // Un point par heure exactement
    const totalPoints = hoursBack;

    this.zones = this.zones.map(zone => {
      const history: SensorData[] = [];
      
      for (let i = totalPoints - 1; i >= 0; i--) {
        // Créer un timestamp à l'heure exacte (minutes=0, secondes=0)
        const currentTime = new Date(now);
        currentTime.setHours(currentTime.getHours() - i);
        currentTime.setMinutes(0);
        currentTime.setSeconds(0);
        currentTime.setMilliseconds(0);
        const timestamp = currentTime.getTime();
        
        // Simulation de variations réalistes sur 24h
        const hourOfDay = new Date(timestamp).getHours();
        
        // Température: plus chaude en journée (12h-18h), plus froide la nuit (0h-6h)
        let baseTemp = 20;
        if (hourOfDay >= 6 && hourOfDay <= 18) {
          baseTemp = 18 + 8 * Math.sin(Math.PI * (hourOfDay - 6) / 12);
        } else {
          baseTemp = 15 + Math.random() * 3;
        }
        const temperature = baseTemp + (Math.random() - 0.5) * 2;
        
        // Humidité: plus élevée la nuit et tôt le matin
        let baseHumidity = 60;
        if (hourOfDay >= 20 || hourOfDay <= 8) {
          baseHumidity = 75;
        } else if (hourOfDay >= 12 && hourOfDay <= 16) {
          baseHumidity = 45;
        }
        const humidity = Math.max(30, Math.min(95, baseHumidity + (Math.random() - 0.5) * 15));
        
        // Humidité du sol: varie lentement, baisse pendant la journée
        let baseMoisture = 50;
        if (hourOfDay >= 10 && hourOfDay <= 16) {
          baseMoisture = 45; // Plus sec pendant les heures chaudes
        }
        const moisture = Math.max(20, Math.min(80, baseMoisture + (Math.random() - 0.5) * 10));
        
        // Lumière: suit le cycle jour/nuit
        let light = 0;
        if (hourOfDay >= 6 && hourOfDay <= 19) {
          const sunPosition = Math.sin(Math.PI * (hourOfDay - 6) / 13);
          light = Math.max(0, 100 + 700 * sunPosition + (Math.random() - 0.5) * 100);
        } else {
          light = Math.random() * 10; // Très peu de lumière la nuit
        }
        
        // Vent: plus variable pendant la journée
        const windSpeed = 3 + Math.random() * 15 + (hourOfDay >= 10 && hourOfDay <= 16 ? 5 : 0);
        
        // Pluie: plus probable en soirée/nuit
        const rainProbability = hourOfDay >= 18 || hourOfDay <= 6 ? 0.15 : 0.05;
        const rainfall = Math.random() < rainProbability;
        
        const soilMoisture10cm = moisture + (Math.random() - 0.5) * 8;
        const soilMoisture30cm = moisture + (Math.random() - 0.5) * 5;
        const soilMoisture60cm = moisture + (Math.random() - 0.5) * 3;
        
        history.push({
          timestamp,
          moisture,
          temperature,
          humidity,
          soilMoisture10cm: Math.max(0, Math.min(100, soilMoisture10cm)),
          soilMoisture30cm: Math.max(0, Math.min(100, soilMoisture30cm)),
          soilMoisture60cm: Math.max(0, Math.min(100, soilMoisture60cm)),
          light: Math.round(Math.max(0, light)),
          windSpeed: Math.round(windSpeed * 10) / 10,
          rainfall,
          rainfallIntensity: rainfall ? 
            (Math.random() < 0.3 ? 'light' : Math.random() < 0.7 ? 'moderate' : 'heavy') as const : 
            'none' as const
        });
      }
      
      return {
        ...zone,
        sensorHistory: history,
        currentReading: history[history.length - 1]
      };
    });
    */ // FIN DU CODE DÉSACTIVÉ
  }

  // ✅ Méthodes conservées pour compatibilité (mais ne génèrent plus de données locales)
  // ✅ Méthodes conservées pour compatibilité (mais ne génèrent plus de données locales)
  public subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    // Send immediate initial state
    listener(this.zones, this.weather);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // ❌ DÉSACTIVÉ - N'exécute plus la simulation locale
  public start() {
    // Ne fait plus rien - les données viennent maintenant du backend
    console.warn('⚠️ simulationService.start() est désactivé. Les données viennent du backend.');
    /* DÉSACTIVÉ
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = window.setInterval(this.tick, this.tickRate);
    */
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  public toggleValve(zoneId: string) {
    // ❌ Actions locales désactivées - utiliser backendService
    console.warn('⚠️ Utilisez backendService.toggleValve() pour envoyer la commande au backend.');
    /* DÉSACTIVÉ
    this.zones = this.zones.map(z => {
      if (z.id === zoneId) {
        return { ...z, isValveOpen: !z.isValveOpen };
      }
      return z;
    });
    this.notify();
    */
  }

  public setWeather(condition: 'Sunny' | 'Cloudy' | 'Rainy') {
    // ❌ Modification météo locale désactivée
    console.warn('⚠️ La météo devrait venir des capteurs du backend.');
    /* DÉSACTIVÉ
    this.weather.condition = condition;
    if (condition === 'Rainy') this.weather.ambientTemp = 20;
    if (condition === 'Sunny') this.weather.ambientTemp = 30;
    if (condition === 'Cloudy') this.weather.ambientTemp = 24;
    this.notify();
    */
  }

  // ❌ DÉSACTIVÉ - Simulation des changements de capteurs (tick)
  private tick = () => {
    // Ne fait plus rien - désactivé
    /* DÉSACTIVÉ - TOUT LE CODE DE SIMULATION LOCALE
    const now = Date.now();
    
    // Simulate Weather Impact
    // Fluctuate ambient temp slightly
    this.weather.ambientTemp += (Math.random() - 0.5) * 0.5;

    this.zones = this.zones.map(zone => {
      let { moisture, temperature, humidity } = zone.currentReading;

      // 1. Calculate Temperature
      // Moves towards ambient temp
      const tempDiff = this.weather.ambientTemp - temperature;
      temperature += tempDiff * 0.05;

      // 2. Calculate Moisture
      if (zone.isValveOpen) {
        // Irrigation adds moisture rapidly
        moisture += 2.5; 
      } else if (this.weather.condition === 'Rainy') {
        // Rain adds moisture slowly
        moisture += 0.5;
      } else {
        // Evaporation
        // Hotter = faster evaporation
        const evaporationRate = 0.1 + (temperature > 25 ? (temperature - 25) * 0.05 : 0);
        moisture -= evaporationRate;
      }

      // Clamp Moisture
      moisture = Math.min(100, Math.max(0, moisture));

      // 3. Humidity links to moisture and weather
      humidity = moisture * 0.6 + (this.weather.condition === 'Rainy' ? 30 : 10) + (Math.random() * 5);
      humidity = Math.min(100, Math.max(0, humidity));

      // 4. Update Status
      let status: Zone['status'] = 'OPTIMAL';
      if (moisture < 30) status = 'WARNING';
      if (moisture < 15) status = 'CRITICAL';
      // Too wet is also bad
      if (moisture > 90) status = 'WARNING'; 

      // Générer les nouvelles données de capteurs
      const soilMoisture10cm = moisture + (Math.random() - 0.5) * 5; // Surface plus variable
      const soilMoisture30cm = moisture + (Math.random() - 0.5) * 3; // Moyenne profondeur
      const soilMoisture60cm = moisture + (Math.random() - 0.5) * 2; // Profondeur plus stable
      
      // Lumière basée sur la météo et l'heure simulée
      const baseLight = this.weather.condition === 'Sunny' ? 800 : 
                       this.weather.condition === 'Cloudy' ? 300 : 50;
      const light = Math.max(0, baseLight + (Math.random() - 0.5) * 200);
      
      // Vent variable
      const windSpeed = 5 + Math.random() * 15; // 5-20 km/h
      
      // Pluie basée sur la météo
      const rainfall = this.weather.condition === 'Rainy';
      const rainfallIntensity = rainfall ? 
        (Math.random() < 0.3 ? 'light' : Math.random() < 0.7 ? 'moderate' : 'heavy') as const : 
        'none' as const;

      const newReading: SensorData = {
        timestamp: now,
        moisture,
        temperature,
        humidity,
        soilMoisture10cm: Math.min(100, Math.max(0, soilMoisture10cm)),
        soilMoisture30cm: Math.min(100, Math.max(0, soilMoisture30cm)),
        soilMoisture60cm: Math.min(100, Math.max(0, soilMoisture60cm)),
        light: Math.round(light),
        windSpeed: Math.round(windSpeed * 10) / 10,
        rainfall,
        rainfallIntensity
      };

      // Keep history limited to 24 points (24 heures avec un point par heure)
      const newHistory = [...zone.sensorHistory, newReading].slice(-24);

      return {
        ...zone,
        currentReading: newReading,
        sensorHistory: newHistory,
        status
      };
    });

    this.notify();
  };
  */ // FIN DU CODE DE SIMULATION DÉSACTIVÉ
  };

  private notify() {
    this.listeners.forEach(l => l(this.zones, this.weather));
  }
}

// ⚠️ Export conservé pour compatibilité mais ne génère plus de données locales
// Utilisez backendService à la place pour les vraies données du backend
export const simulationService = new SimulationService();