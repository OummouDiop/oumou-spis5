import React, { useEffect, useState } from 'react';
import { backendService } from '../services/backendService';
import { Zone, WeatherCondition } from '../types';
import ZoneCard from '../components/ZoneCard';
import SensorChart from '../components/SensorChart';
import AIAdvisor from '../components/AIAdvisor';
import { 
  CloudRain, Sun, Cloud, LayoutDashboard, Settings, 
  Droplet, Activity, Power, ArrowLeft
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (page: 'home' | 'dashboard') => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [weather, setWeather] = useState<WeatherCondition>({ condition: 'Sunny', ambientTemp: 25 });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Subscribe to backend service on mount
  useEffect(() => {
    console.log('🎯 [Dashboard] Subscribing to backendService...');
    const unsubscribe = backendService.subscribe((updatedZones, updatedWeather) => {
      console.log('📥 [Dashboard] Received update:', {
        zonesCount: updatedZones.length,
        weather: updatedWeather.condition,
        temp: updatedWeather.ambientTemp
      });
      
      if (updatedZones.length > 0) {
        const firstZone = updatedZones[0];
        console.log('🌱 [Dashboard] First zone data:', {
          name: firstZone.name,
          temp: firstZone.currentReading.temperature,
          soil10: firstZone.currentReading.soilMoisture10cm,
          soil30: firstZone.currentReading.soilMoisture30cm,
          soil60: firstZone.currentReading.soilMoisture60cm
        });
      }
      
      setZones(updatedZones);
      setWeather(updatedWeather);
      
      // Auto-select first zone if none selected
      if (!selectedZoneId && updatedZones.length > 0) {
        setSelectedZoneId(updatedZones[0].id);
      }
    });
    console.log('✅ [Dashboard] Subscribed successfully');
    return () => {
      console.log('🔌 [Dashboard] Unsubscribing...');
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  const handleValveToggle = (id: string) => {
    backendService.toggleValve(id);
  };

  const handleWeatherChange = (condition: 'Sunny' | 'Cloudy' | 'Rainy') => {
    backendService.setWeather(condition);
  };

  // Version de test - affiche le dashboard même sans données
  if (zones.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        {onNavigate && (
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
        )}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard SmartIrrig</h1>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-center mb-4">
              <Droplet className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Système d'irrigation intelligent</h2>
            <p className="text-gray-500 mb-6">Initialisation du service de simulation en cours...</p>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Safe check for loading state
  if (!selectedZone) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          {onNavigate && (
            <button 
              onClick={() => onNavigate('home')}
              className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </button>
          )}
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-gray-700">Initialisation de SmartIrrig...</h2>
          <p className="text-gray-500 mt-2">Chargement des données IoT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Droplet className="text-blue-500" />
            SmartIrrig
          </h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-6 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </p>
          </div>
          
          <div className="mt-2">
            <a className="flex items-center px-6 py-3 text-gray-700 bg-blue-50 border-r-4 border-blue-500">
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </a>
            <a className="flex items-center px-6 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
              <Settings className="w-5 h-5 mr-3" />
              Paramètres
            </a>
            <a className="flex items-center px-6 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50">
              <Activity className="w-5 h-5 mr-3" />
              Statistiques
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Tableau de Bord</h2>
              <p className="text-gray-600 mt-1">Gérez votre système d'irrigation intelligent</p>
            </div>
            
            {/* Weather Controls */}
            <div className="flex gap-2">
              {(['Sunny', 'Cloudy', 'Rainy'] as const).map((condition) => {
                const Icon = condition === 'Sunny' ? Sun : condition === 'Cloudy' ? Cloud : CloudRain;
                const isActive = weather.condition === condition;
                
                return (
                  <button
                    key={condition}
                    onClick={() => handleWeatherChange(condition)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {condition === 'Sunny' ? 'Ensoleillé' : condition === 'Cloudy' ? 'Nuageux' : 'Pluvieux'}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Weather Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {weather.condition === 'Sunny' ? <Sun className="text-yellow-500" /> : 
                 weather.condition === 'Cloudy' ? <Cloud className="text-gray-500" /> : 
                 <CloudRain className="text-blue-500" />}
                <span className="font-medium text-gray-800">
                  {weather.condition === 'Sunny' ? 'Ensoleillé' : 
                   weather.condition === 'Cloudy' ? 'Nuageux' : 'Pluvieux'}
                </span>
              </div>
              <div className="text-gray-600">
                Température: {weather.ambientTemp}°C
              </div>
            </div>
          </div>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              onValveToggle={handleValveToggle}
              onSelect={setSelectedZoneId}
              isSelected={selectedZoneId === zone.id}
            />
          ))}
        </div>

        {/* Selected Zone Details */}
        {selectedZone && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Données de {selectedZone.name}
              </h3>
              <SensorChart zone={selectedZone} />
            </div>

            {/* AI Advisor */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <AIAdvisor zone={selectedZone} weather={weather} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;