import React from 'react';
import { Zone } from '../types';
import { Droplets, Thermometer, Wind, AlertTriangle, CheckCircle2, Power } from 'lucide-react';

interface ZoneCardProps {
  zone: Zone;
  onValveToggle: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, onValveToggle, onSelect, isSelected }) => {
  const { moisture, temperature, humidity } = zone.currentReading;

  // Dynamic Styles based on Status
  const statusColor = {
    'OPTIMAL': 'bg-emerald-500',
    'WARNING': 'bg-amber-500',
    'CRITICAL': 'bg-rose-500'
  }[zone.status];

  const statusText = {
    'OPTIMAL': 'text-emerald-700 bg-emerald-100',
    'WARNING': 'text-amber-700 bg-amber-100',
    'CRITICAL': 'text-rose-700 bg-rose-100'
  }[zone.status];

  return (
    <div 
      onClick={() => onSelect(zone.id)}
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer group
        ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-lg scale-[1.02]' : 'border-white hover:border-indigo-200 shadow hover:shadow-md bg-white'}
      `}
    >
      {/* Top Status Bar */}
      <div className={`h-1.5 w-full ${statusColor}`} />

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg group-hover:text-indigo-700 transition-colors">
              {zone.name}
            </h3>
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              {zone.cropType} • {zone.area} ha
            </span>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${statusText}`}>
            {zone.status === 'OPTIMAL' ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
            {zone.status}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Moisture */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-blue-50">
            <Droplets size={16} className="text-blue-500 mb-1" />
            <span className="text-lg font-bold text-gray-800">{moisture.toFixed(0)}%</span>
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Humidité</span>
          </div>

          {/* Temp */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-orange-50">
            <Thermometer size={16} className="text-orange-500 mb-1" />
            <span className="text-lg font-bold text-gray-800">{temperature.toFixed(1)}°</span>
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Temp.</span>
          </div>

          {/* Humidity (Air) */}
          <div className="flex flex-col items-center p-2 rounded-lg bg-cyan-50">
            <Wind size={16} className="text-cyan-500 mb-1" />
            <span className="text-lg font-bold text-gray-800">{humidity.toFixed(0)}%</span>
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Air</span>
          </div>
        </div>

        {/* Valve & Pump Status */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-lg border-2 transition-all"
             style={{
               borderColor: zone.isValveOpen ? '#3b82f6' : '#e5e7eb',
               backgroundColor: zone.isValveOpen ? '#eff6ff' : '#f9fafb'
             }}>
          <div className="flex items-center gap-2">
            <Power 
              size={18} 
              className={`${zone.isValveOpen ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}
            />
            <div>
              <span className="text-xs font-semibold text-gray-600 block">
                {zone.isValveOpen ? '💧 Pompe Active' : '⚫ Pompe Inactive'}
              </span>
              <span className="text-[10px] text-gray-500">
                {zone.isValveOpen ? 'Irrigation en cours...' : 'Système en veille'}
              </span>
            </div>
          </div>
          <div className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 ${
            zone.isValveOpen 
              ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200' 
              : 'border-gray-300 bg-white text-gray-600'
          }`}>
            {zone.isValveOpen ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneCard;