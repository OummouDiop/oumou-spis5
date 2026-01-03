import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { backendService } from './backendService';
import { Zone, WeatherCondition } from '../types';
import { 
  CloudRain, Sun, Cloud, LayoutDashboard, Settings, 
  Droplet, Activity, Power, ArrowLeft, Clock, Thermometer,
  Beaker, Sprout, Lightbulb, Wind, CloudDrizzle
} from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [weather, setWeather] = useState<WeatherCondition>({ condition: 'Sunny', ambientTemp: 25 });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Subscribe to backend service on mount
  useEffect(() => {
    const unsubscribe = backendService.subscribe((updatedZones, updatedWeather) => {
      setZones(updatedZones);
      setWeather(updatedWeather);
      
      // Auto-select first zone if none selected
      if (!selectedZoneId && updatedZones.length > 0) {
        setSelectedZoneId(updatedZones[0].id);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  const handleValveToggle = (id: string) => {
    backendService.toggleValve(id);
  };

  const handleWeatherChange = (condition: 'Sunny' | 'Cloudy' | 'Rainy') => {
    backendService.setWeather(condition);
  };

  // Safe check for loading state
  if (zones.length === 0 || !selectedZone) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <button 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-gray-700">Initialisation de SmartIrrig...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* Sidebar / Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-lg">
              <Droplet size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SmartIrrig</h1>
          </div>
          <p className="text-slate-400 text-xs mt-2 pl-1">IoT & AI Dashboard</p>
        </div>

        <nav className="p-4 space-y-2 flex-grow">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-lg text-white shadow-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Retour Accueil</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-900/20">
            <LayoutDashboard size={20} />
            <span className="font-medium">Tableau de bord</span>
          </button>
          <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
            Contrôle Simulation
          </div>
          <div className="space-y-1 px-2">
             <button 
                onClick={() => handleWeatherChange('Sunny')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${weather.condition === 'Sunny' ? 'bg-slate-800 text-yellow-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               <Sun size={18} /> Soleil
             </button>
             <button 
                onClick={() => handleWeatherChange('Cloudy')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${weather.condition === 'Cloudy' ? 'bg-slate-800 text-gray-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               <Cloud size={18} /> Nuageux
             </button>
             <button 
                onClick={() => handleWeatherChange('Rainy')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${weather.condition === 'Rainy' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               <CloudRain size={18} /> Pluie
             </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Simulation active <br/> WebSocket Mock v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen">
        
        {/* Header Stats */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble</h2>
            <p className="text-gray-500">Météo actuelle: <span className="font-medium text-gray-700">{weather.condition === 'Sunny' ? 'Ensoleillé' : weather.condition === 'Rainy' ? 'Pluvieux' : 'Nuageux'}</span> • Temp. Ambiante: {weather.ambientTemp.toFixed(1)}°C</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Système en ligne</span>
             </div>
          </div>
        </header>

        {/* Champ Principal */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Sprout size={24} className="text-green-600"/>
                  {selectedZone.name}
                </h3>
                <p className="text-gray-500 mt-1">{selectedZone.area} hectares</p>
              </div>
              {/* Indicateur d'état de l'irrigation (non-cliquable) */}
              <div 
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold text-lg shadow-lg ${
                  selectedZone.isValveOpen 
                    ? 'bg-green-500 text-white animate-pulse' 
                    : 'bg-red-300 text-red-800'
                }`}
              >
                <Power size={20} />
                <div>
                  <div>{selectedZone.isValveOpen ? 'IRRIGATION EN COURS' : 'IRRIGATION INACTIVE'}</div>
                  <div className="text-xs font-normal opacity-90">
                    {selectedZone.isValveOpen ? '💧 Pompe active' : '⚫ Pompe arrêtée'}
                  </div>
                </div>
              </div>
            </div>

            {/* Informations détaillées - Design moderne */}
            <div className="space-y-6 mb-8">
              {/* Première ligne - Informations temporelles et environnementales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Heure */}
                <div className="group bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div className="text-white/80 text-sm font-medium">⏰ Heure</div>
                  </div>
                  <div className="text-white">
                    <div className="text-3xl font-bold mb-1">
                      {new Date(selectedZone.currentReading.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-blue-200 text-sm">
                      {new Date(selectedZone.currentReading.timestamp).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                {/* Température */}
                <div className="group bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Thermometer size={20} className="text-white" />
                    </div>
                    <div className="text-white/80 text-sm font-medium">🌡️ Température</div>
                  </div>
                  <div className="text-white">
                    <div className="text-3xl font-bold mb-1">
                      {selectedZone.currentReading.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-orange-200 text-sm">
                      {selectedZone.currentReading.temperature > 25 ? 'Chaude' : 
                       selectedZone.currentReading.temperature > 15 ? 'Modérée' : 'Fraîche'}
                    </div>
                  </div>
                </div>

                {/* Humidité de l'air */}
                <div className="group bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Beaker size={20} className="text-white" />
                    </div>
                    <div className="text-white/80 text-sm font-medium">💧 Humidité air</div>
                  </div>
                  <div className="text-white">
                    <div className="text-3xl font-bold mb-1">
                      {selectedZone.currentReading.humidity.toFixed(1)}%
                    </div>
                    <div className="text-cyan-200 text-sm flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${selectedZone.currentReading.humidity}%` }}
                        />
                      </div>
                      {selectedZone.currentReading.humidity > 70 ? 'Élevée' : 
                       selectedZone.currentReading.humidity > 40 ? 'Normale' : 'Faible'}
                    </div>
                  </div>
                </div>

                {/* Pluie */}
                <div className="group bg-gradient-to-br from-slate-500 via-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <CloudDrizzle size={20} className="text-white" />
                    </div>
                    <div className="text-white/80 text-sm font-medium">🌧️ Pluie</div>
                  </div>
                  <div className="text-white">
                    <div className="text-2xl font-bold mb-1">
                      {selectedZone.currentReading.rainfall ? 
                        `${selectedZone.currentReading.rainfallIntensity === 'light' ? 'Légère' : 
                          selectedZone.currentReading.rainfallIntensity === 'moderate' ? 'Modérée' : 'Forte'}` : 
                        'Aucune'}
                    </div>
                    <div className="text-blue-200 text-sm">
                      {selectedZone.currentReading.rainfall ? '💧 Précipitations en cours' : '☀️ Temps sec'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deuxième ligne - Humidité du sol */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-green-100">
                <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                  <Sprout size={20} />
                  🌱 Humidité du sol (profondeurs)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-green-600">Surface (10cm)</span>
                      <div className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">Critique</div>
                    </div>
                    <div className="text-2xl font-bold text-green-800 mb-2">
                      {selectedZone.currentReading.soilMoisture10cm.toFixed(1)}%
                    </div>
                    <div className="w-full h-3 bg-green-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
                        style={{ width: `${selectedZone.currentReading.soilMoisture10cm}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-green-600">Moyenne (30cm)</span>
                      <div className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">Racines</div>
                    </div>
                    <div className="text-2xl font-bold text-green-800 mb-2">
                      {selectedZone.currentReading.soilMoisture30cm.toFixed(1)}%
                    </div>
                    <div className="w-full h-3 bg-green-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-700 rounded-full transition-all duration-700"
                        style={{ width: `${selectedZone.currentReading.soilMoisture30cm}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-green-600">Profonde (60cm)</span>
                      <div className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">Réserve</div>
                    </div>
                    <div className="text-2xl font-bold text-green-800 mb-2">
                      {selectedZone.currentReading.soilMoisture60cm.toFixed(1)}%
                    </div>
                    <div className="w-full h-3 bg-green-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-600 to-green-800 rounded-full transition-all duration-700"
                        style={{ width: `${selectedZone.currentReading.soilMoisture60cm}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Troisième ligne - Conditions environnementales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Lumière */}
                <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-amber-500 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Lightbulb size={20} className="text-white" />
                    </div>
                    <div className="text-white/80 text-sm font-medium">☀️ Lumière</div>
                  </div>
                  <div className="text-white">
                    <div className="text-3xl font-bold mb-1">
                      {selectedZone.currentReading.light} lux
                    </div>
                    <div className="text-yellow-200 text-sm flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(selectedZone.currentReading.light / 10, 100)}%` }}
                        />
                      </div>
                      {selectedZone.currentReading.light > 500 ? 'Intense' : 
                       selectedZone.currentReading.light > 200 ? 'Modérée' : 'Faible'}
                    </div>
                  </div>
                </div>

                {/* Vent */}
                <div className="bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Wind size={20} className="text-white" />
                    </div>
                    <div className="text-white/80 text-sm font-medium">🌬️ Vent</div>
                  </div>
                  <div className="text-white">
                    <div className="text-3xl font-bold mb-1">
                      {selectedZone.currentReading.windSpeed} km/h
                    </div>
                    <div className="text-gray-200 text-sm flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(selectedZone.currentReading.windSpeed * 2, 100)}%` }}
                        />
                      </div>
                      {selectedZone.currentReading.windSpeed > 25 ? 'Fort' : 
                       selectedZone.currentReading.windSpeed > 10 ? 'Modéré' : 'Calme'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Graphiques */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Graphique Température */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Thermometer size={20} className="text-orange-600"/>
              Évolution de la température (24h)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedZone.sensorHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(time) => {
                      const hour = new Date(time).getHours();
                      return `${hour}h`;
                    }}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(time) => new Date(time).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Température']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="0"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique Humidité du sol */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sprout size={20} className="text-green-600"/>
              Humidité du sol - 3 niveaux (24h)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedZone.sensorHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(time) => {
                      const hour = new Date(time).getHours();
                      return `${hour}h`;
                    }}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(time) => new Date(time).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`, 
                      name === 'soilMoisture10cm' ? '10cm' : 
                      name === 'soilMoisture30cm' ? '30cm' : '60cm'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="soilMoisture10cm" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={false}
                    name="10cm"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="soilMoisture30cm" 
                    stroke="#16a34a" 
                    strokeWidth={2}
                    dot={false}
                    name="30cm"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="soilMoisture60cm" 
                    stroke="#15803d" 
                    strokeWidth={2}
                    dot={false}
                    name="60cm"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>

        {/* Graphiques supplémentaires */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Graphique Lumière */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-yellow-600"/>
              Intensité lumineuse (24h)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedZone.sensorHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(time) => {
                      const hour = new Date(time).getHours();
                      return `${hour}h`;
                    }}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(time) => new Date(time).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    formatter={(value: number) => [`${value} lux`, 'Lumière']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="light" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique Vent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Wind size={20} className="text-gray-600"/>
              Vitesse du vent (24h)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedZone.sensorHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(time) => {
                      const hour = new Date(time).getHours();
                      return `${hour}h`;
                    }}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(time) => new Date(time).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    formatter={(value: number) => [`${value} km/h`, 'Vent']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="windSpeed" 
                    stroke="#6b7280" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

export default Dashboard;