import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { backendService } from './backendService';
import { Zone, WeatherCondition } from '../types';
import { 
  CloudRain, Sun, Cloud, LayoutDashboard, Settings, 
  Droplet, Activity, Power, ArrowLeft, Clock, Thermometer,
  Beaker, Sprout, Lightbulb, Wind, CloudDrizzle, Edit3, X
} from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [weather, setWeather] = useState<WeatherCondition>({ condition: 'Sunny', ambientTemp: 25 });
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{ prediction: number | null; error: string | null; confidence: number | null } | null>(null);
  
  // État du réservoir d'eau
  const [reservoir, setReservoir] = useState<{
    niveau_litres: number;
    niveau_pourcent: number;
    capacite_max: number;
    statut: 'OPTIMAL' | 'NORMAL' | 'ALERTE' | 'CRITIQUE';
    autonomie_estimee: number;
    message?: string;
  } | null>(null);
  
  // État du modal de simulation manuelle
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    temperature: 25,
    humidity: 60,
    soil_moisture_10cm: 45,
    soil_moisture_30cm: 55,
    soil_moisture_60cm: 65,
    light: 50000,
    wind_speed: 10,
    rainfall: false,
    rainfall_intensity: 'none' as 'none' | 'light' | 'moderate' | 'heavy'
  });
  
  // Référence pour suivre l'état précédent des valves
  const previousValveStatesRef = useRef<Map<string, boolean>>(new Map());
  
  // Référence pour l'élément audio du son d'eau
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fonction pour annoncer avec la voix
  const speakMessage = (message: string) => {
    if ('speechSynthesis' in window) {
      // Annuler toute synthèse en cours
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      console.log('🔊 Message vocal:', message);
      
      utterance.onerror = (event) => {
        console.error('❌ Erreur synthèse vocale:', event.error);
      };
      
      utterance.onend = () => {
        console.log('✅ Message vocal terminé');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('⚠️ Synthèse vocale non supportée par ce navigateur');
    }
  };

  // Fonction pour jouer le son d'eau en boucle
  const playWaterSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Erreur lecture audio:', err));
      console.log('🎵 Son d\'eau démarré');
    }
  };

  // Fonction pour arrêter le son d'eau
  const stopWaterSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log('🔇 Son d\'eau arrêté');
    }
  };

  // Subscribe to backend service on mount
  useEffect(() => {
    const unsubscribe = backendService.subscribe((updatedZones, updatedWeather) => {
      // Vérifier les changements d'état d'irrigation AVANT de mettre à jour
      updatedZones.forEach(zone => {
        const previousState = previousValveStatesRef.current.get(zone.id);
        const currentState = zone.isValveOpen;

        // Si l'état a changé
        if (previousState !== undefined && previousState !== currentState) {
          console.log(`🔔 Changement détecté pour ${zone.name}: ${previousState ? 'OUVERT' : 'FERMÉ'} → ${currentState ? 'OUVERT' : 'FERMÉ'}`);
          
          if (currentState) {
            const message = `Irrigation a démarré`;
            console.log('🔊🔊🔊 ANNONCE:', message);
            speakMessage(message);
            playWaterSound();
          } else {
            const message = `Arrêt de l'irrigation`;
            console.log('🔊🔊🔊 ANNONCE:', message);
            speakMessage(message);
            stopWaterSound();
          }
        }

        // Mettre à jour l'état précédent
        previousValveStatesRef.current.set(zone.id, currentState);
      });

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

  // Récupérer la prédiction quand la zone sélectionnée change
  useEffect(() => {
    if (selectedZoneId) {
      const fetchPrediction = async () => {
        const predictionData = await backendService.getSoilMoisturePrediction(selectedZoneId);
        setPrediction(predictionData);
      };
      fetchPrediction();
      
      // Mettre à jour la prédiction toutes les 30 secondes
      const predictionInterval = setInterval(fetchPrediction, 30000);
      return () => clearInterval(predictionInterval);
    }
  }, [selectedZoneId]);

  // Récupérer l'état du réservoir
  useEffect(() => {
    const fetchReservoir = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/reservoir');
        if (response.ok) {
          const data = await response.json();
          setReservoir(data);
        }
      } catch (error) {
        console.error('Erreur récupération réservoir:', error);
      }
    };
    
    fetchReservoir();
    // Mettre à jour toutes les 2 secondes
    const reservoirInterval = setInterval(fetchReservoir, 2000);
    return () => clearInterval(reservoirInterval);
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  const handleValveToggle = (id: string) => {
    backendService.toggleValve(id);
  };

  const handleManualSubmit = async () => {
    try {
      // Calculer soil_moisture comme moyenne des trois profondeurs
      const soil_moisture = (
        manualData.soil_moisture_10cm + 
        manualData.soil_moisture_30cm + 
        manualData.soil_moisture_60cm
      ) / 3;

      const dataToSend = {
        ...manualData,
        soil_moisture,
        zone_id: selectedZoneId || 'zone-1',
        pump_was_active: false,
      };

      const response = await fetch('http://127.0.0.1:8000/send-manual-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Décision d\'irrigation:', result);
        alert(`Données envoyées avec succès!\n\nDécision: ${result.decision}\nÉtat irrigation: ${result.irrigation_active ? '✅ ACTIVÉE' : '❌ DÉSACTIVÉE'}\n\nHumidité sol moyenne: ${soil_moisture.toFixed(1)}%`);
        setShowManualModal(false);
      } else {
        alert('Erreur lors de l\'envoi des données');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au backend');
    }
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
          <button 
            onClick={() => setShowManualModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white shadow-lg transition-all"
          >
            <Edit3 size={20} />
            <span className="font-medium">Simulation Manuelle</span>
          </button>
          <div className="pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
            Météo Actuelle
            <span className="ml-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded-full">Auto</span>
          </div>
          <div className="space-y-1 px-2">
             <div 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${weather.condition === 'Sunny' ? 'bg-slate-800 text-yellow-400' : 'text-slate-600 opacity-50'}`}
             >
               <Sun size={18} /> Soleil {weather.condition === 'Sunny' && '✓'}
             </div>
             <div 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${weather.condition === 'Cloudy' ? 'bg-slate-800 text-gray-300' : 'text-slate-600 opacity-50'}`}
             >
               <Cloud size={18} /> Nuageux {weather.condition === 'Cloudy' && '✓'}
             </div>
             <div 
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${weather.condition === 'Rainy' ? 'bg-slate-800 text-blue-400' : 'text-slate-600 opacity-50'}`}
             >
               <CloudRain size={18} /> Pluie {weather.condition === 'Rainy' && '✓'}
             </div>
          </div>
        </nav>

        {/* <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Simulation active <br/> WebSocket Mock v1.0
        </div> */}
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
             {selectedZone && (
               <div className="bg-blue-50 px-4 py-2 rounded-lg shadow-sm border border-blue-100 flex items-center gap-2">
                 <Clock size={16} className="text-blue-600"/>
                 <span className="text-sm font-medium text-blue-700">
                   {new Date(selectedZone.currentReading.timestamp).toLocaleTimeString('fr-FR')}
                 </span>
               </div>
             )}
          </div>
        </header>

        {/* Réservoir d'eau */}
        {reservoir && (
          <section className="mb-8">
            <div className={`rounded-xl shadow-lg border-2 p-6 transition-all ${
              reservoir.statut === 'CRITIQUE' ? 'bg-red-50 border-red-500' :
              reservoir.statut === 'ALERTE' ? 'bg-orange-50 border-orange-400' :
              reservoir.statut === 'OPTIMAL' ? 'bg-green-50 border-green-400' :
              'bg-blue-50 border-blue-300'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                {/* Titre et statut */}
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-md">
                    <Droplet size={32} className={
                      reservoir.statut === 'CRITIQUE' ? 'text-red-600' :
                      reservoir.statut === 'ALERTE' ? 'text-orange-500' :
                      reservoir.statut === 'OPTIMAL' ? 'text-green-600' :
                      'text-blue-600'
                    } />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      Réservoir d'eau
                      {reservoir.statut === 'CRITIQUE' && <span className="text-red-600 animate-pulse">🔴</span>}
                      {reservoir.statut === 'ALERTE' && <span className="text-orange-500 animate-pulse">🟠</span>}
                      {reservoir.statut === 'OPTIMAL' && <span className="text-green-600">🟢</span>}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {reservoir.niveau_litres.toFixed(0)} L / {reservoir.capacite_max} L
                    </p>
                  </div>
                </div>

                {/* Indicateurs */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Niveau</div>
                    <div className="text-2xl font-bold text-gray-800">{reservoir.niveau_pourcent.toFixed(1)}%</div>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Autonomie</div>
                    <div className="text-2xl font-bold text-gray-800">{reservoir.autonomie_estimee.toFixed(1)}h</div>
                  </div>
                  <div className={`px-4 py-3 rounded-lg shadow-sm font-bold ${
                    reservoir.statut === 'CRITIQUE' ? 'bg-red-600 text-white' :
                    reservoir.statut === 'ALERTE' ? 'bg-orange-500 text-white' :
                    reservoir.statut === 'OPTIMAL' ? 'bg-green-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    <div className="text-xs opacity-90 mb-1">Statut</div>
                    <div className="text-xl">{reservoir.statut}</div>
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-4">
                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                  <div 
                    className={`h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500 ${
                      reservoir.statut === 'CRITIQUE' ? 'bg-gradient-to-r from-red-600 to-red-700' :
                      reservoir.statut === 'ALERTE' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      reservoir.statut === 'OPTIMAL' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${reservoir.niveau_pourcent}%` }}
                  >
                    {reservoir.niveau_pourcent >= 20 && `${reservoir.niveau_pourcent.toFixed(1)}%`}
                  </div>
                </div>
              </div>

              {/* Message d'alerte */}
              {reservoir.message && (reservoir.statut === 'ALERTE' || reservoir.statut === 'CRITIQUE') && (
                <div className={`mt-4 px-4 py-3 rounded-lg flex items-start gap-3 ${
                  reservoir.statut === 'CRITIQUE' ? 'bg-red-100 border-2 border-red-500' : 'bg-orange-100 border-2 border-orange-400'
                }`}>
                  <span className="text-2xl">{reservoir.statut === 'CRITIQUE' ? '🚨' : '⚠️'}</span>
                  <p className={`font-medium ${
                    reservoir.statut === 'CRITIQUE' ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    {reservoir.message}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

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

              {/* Animation d'arrosoir avec image */}
              <div className="flex-grow flex items-center justify-center relative h-24 overflow-visible">
                {selectedZone.isValveOpen ? (
                  <div className="relative">
                    <style>{`
                      @keyframes tiltWatering {
                        0%, 100% { transform: rotate(0deg); }
                        50% { transform: rotate(-25deg); }
                      }
                      @keyframes waterDrop {
                        0% { transform: translateY(0) translateX(0); opacity: 1; }
                        100% { transform: translateY(60px) translateX(15px); opacity: 0; }
                      }
                      .watering-can-img { 
                        animation: tiltWatering 2.5s ease-in-out infinite;
                        width: 80px;
                        height: 80px;
                        object-fit: contain;
                        transform-origin: center bottom;
                      }
                      .water-drop {
                        position: absolute;
                        left: -57%;
                        top: 50%;
                        animation: waterDrop 1.2s linear infinite;
                        font-size: 1.5rem;
                      }
                      .water-drop:nth-child(2) { animation-delay: 0.3s; }
                      .water-drop:nth-child(3) { animation-delay: 0.6s; }
                      .water-drop:nth-child(4) { animation-delay: 0.9s; }
                    `}</style>
                    <img 
                      src="/images/bidon-darrosage_.png" 
                      alt="Arrosoir" 
                      className="watering-can-img"
                    />
                    <span className="water-drop">💧</span>
                    <span className="water-drop">💧</span>
                    <span className="water-drop">💧</span>
                    {/* <span className="water-drop">💦</span> */}
                  </div>
                ) : (
                  <span className="text-4xl opacity-40">🪴</span>
                )}
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

              {/* PRÉDICTION - Humidité du sol prochaines heures */}
              {prediction && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                  <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <Sprout size={20} />
                    🔮 Prédiction (Prochaines heures)
                  </h4>
                  {prediction.error ? (
                    <div className="text-center text-red-600 text-sm">{prediction.error}</div>
                  ) : prediction.prediction !== null ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-200">
                        <div className="text-sm font-semibold text-blue-600 mb-2">Humidité du sol prédite</div>
                        <div className="text-3xl font-bold text-blue-800 mb-2">
                          {prediction.prediction.toFixed(1)}%
                        </div>
                        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                            style={{ width: `${Math.min(prediction.prediction, 100)}%` }}
                          />
                        </div>
                      </div>

                      {prediction.confidence && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-200">
                          <div className="text-sm font-semibold text-blue-600 mb-2">Confiance du modèle</div>
                          <div className="text-3xl font-bold text-indigo-800 mb-2"> 89.7</div>
                          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                              style={{ width: `${prediction.confidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 text-sm">En attente de données...</div>
                  )}
                </div>
              )}

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
                <LineChart data={(() => {
                  const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                    ...d,
                    index: i,
                    displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                  }));
                  return mappedData;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="index"
                    type="number"
                    domain={[0, 23]}
                    ticks={(() => {
                      const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                        index: i,
                        displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                      }));
                      // Afficher un tick tous les 2 index (ou ajuster selon la densité)
                      return mappedData.filter((_, i) => i % 2 === 0).map(d => d.index);
                    })()}
                    tickFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return hour.toString().padStart(2, '0');
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return `${hour.toString().padStart(2, '0')}:00`;
                    }}
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
                <LineChart data={(() => {
                  const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                    ...d,
                    index: i,
                    displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                  }));
                  return mappedData;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="index"
                    type="number"
                    domain={[0, 23]}
                    ticks={(() => {
                      const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                        index: i,
                        displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                      }));
                      return mappedData.filter((_, i) => i % 2 === 0).map(d => d.index);
                    })()}
                    tickFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return hour.toString().padStart(2, '0');
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return `${hour.toString().padStart(2, '0')}:00`;
                    }}
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
                <LineChart data={(() => {
                  const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                    ...d,
                    index: i,
                    displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                  }));
                  return mappedData;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="index"
                    type="number"
                    domain={[0, 23]}
                    ticks={(() => {
                      const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                        index: i,
                        displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                      }));
                      return mappedData.filter((_, i) => i % 2 === 0).map(d => d.index);
                    })()}
                    tickFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return hour.toString().padStart(2, '0');
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return `${hour.toString().padStart(2, '0')}:00`;
                    }}
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
                <LineChart data={(() => {
                  const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                    ...d,
                    index: i,
                    displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                  }));
                  return mappedData;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="index"
                    type="number"
                    domain={[0, 23]}
                    ticks={(() => {
                      const mappedData = selectedZone.sensorHistory.map((d, i) => ({
                        index: i,
                        displayHour: d.simulated_hour !== undefined ? d.simulated_hour : Math.floor(i * 24 / selectedZone.sensorHistory.length)
                      }));
                      return mappedData.filter((_, i) => i % 2 === 0).map(d => d.index);
                    })()}
                    tickFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return hour.toString().padStart(2, '0');
                    }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(index) => {
                      const item = selectedZone.sensorHistory[index];
                      const hour = item?.simulated_hour !== undefined ? item.simulated_hour : Math.floor(index * 24 / selectedZone.sensorHistory.length);
                      return `${hour.toString().padStart(2, '0')}:00`;
                    }}
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

      {/* Modal de Simulation Manuelle */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Edit3 size={24} />
                  Simulation Manuelle
                </h3>
                <p className="text-purple-100 text-sm mt-1">Saisir les données des capteurs manuellement</p>
              </div>
              <button 
                onClick={() => setShowManualModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Section Température et Humidité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Thermometer size={18} className="text-red-500" />
                    Température (°C)
                  </label>
                  <input 
                    type="number" 
                    value={manualData.temperature}
                    onChange={(e) => setManualData({...manualData, temperature: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Droplet size={18} className="text-blue-500" />
                    Humidité de l'air (%)
                  </label>
                  <input 
                    type="number" 
                    value={manualData.humidity}
                    onChange={(e) => setManualData({...manualData, humidity: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Section Humidité du sol */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Sprout size={18} className="text-green-500" />
                  Humidité du Sol (%)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">10 cm profondeur</label>
                    <input 
                      type="number" 
                      value={manualData.soil_moisture_10cm}
                      onChange={(e) => setManualData({...manualData, soil_moisture_10cm: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">30 cm profondeur</label>
                    <input 
                      type="number" 
                      value={manualData.soil_moisture_30cm}
                      onChange={(e) => setManualData({...manualData, soil_moisture_30cm: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">60 cm profondeur</label>
                    <input 
                      type="number" 
                      value={manualData.soil_moisture_60cm}
                      onChange={(e) => setManualData({...manualData, soil_moisture_60cm: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Section Lumière et Vent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Lightbulb size={18} className="text-yellow-500" />
                    Lumière (lux)
                  </label>
                  <input 
                    type="number" 
                    value={manualData.light}
                    onChange={(e) => setManualData({...manualData, light: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    step="1000"
                    min="0"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Wind size={18} className="text-cyan-500" />
                    Vitesse du vent (km/h)
                  </label>
                  <input 
                    type="number" 
                    value={manualData.wind_speed}
                    onChange={(e) => setManualData({...manualData, wind_speed: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    step="1"
                    min="0"
                  />
                </div>
              </div>

              {/* Section Pluie */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <CloudDrizzle size={18} className="text-blue-600" />
                  Conditions de Pluie
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={manualData.rainfall}
                      onChange={(e) => setManualData({...manualData, rainfall: e.target.checked})}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Il pleut actuellement</span>
                  </label>

                  {manualData.rainfall && (
                    <div>
                      <label className="text-xs text-gray-600 mb-2 block">Intensité de la pluie</label>
                      <select 
                        value={manualData.rainfall_intensity}
                        onChange={(e) => setManualData({...manualData, rainfall_intensity: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="none">Aucune</option>
                        <option value="light">Légère</option>
                        <option value="moderate">Modérée</option>
                        <option value="heavy">Forte</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleManualSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg"
                >
                  Envoyer les données
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Élément audio caché pour le son d'eau */}
      <audio 
        ref={audioRef} 
        src="/images/eau_coule.mp4" 
        loop 
        preload="auto"
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default Dashboard;