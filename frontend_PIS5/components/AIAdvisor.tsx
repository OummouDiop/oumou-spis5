import React, { useState, useEffect } from 'react';
import { Zone } from '../types';
import { getIrrigationAdvice } from '../services/geminiService';
import { Bot, RefreshCw, Loader2, Sprout } from 'lucide-react';

interface AIAdvisorProps {
  selectedZone: Zone;
  weatherCondition: string;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ selectedZone, weatherCondition }) => {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const fetchAdvice = async () => {
    setLoading(true);
    setAdvice("");
    const result = await getIrrigationAdvice(selectedZone, weatherCondition);
    setAdvice(result);
    setLoading(false);
    setLastUpdate(Date.now());
  };

  // Auto-fetch when zone changes, but prevent spamming API on every sensor tick
  // Only re-fetch if zone ID changes or manually requested
  useEffect(() => {
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone.id]); 

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-indigo-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">SmartIrrig Assistant</h3>
            <p className="text-xs text-indigo-600 font-medium">Propulsé par Gemini 2.5</p>
          </div>
        </div>
        <button 
          onClick={fetchAdvice}
          disabled={loading}
          className="p-2 hover:bg-white rounded-full transition-colors text-indigo-600 disabled:opacity-50"
          title="Actualiser l'analyse"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </div>

      <div className="flex-grow bg-white/60 rounded-lg p-4 border border-indigo-100/50 backdrop-blur-sm overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-indigo-400 gap-3">
            <Sprout size={32} className="animate-bounce" />
            <p className="text-sm">Analyse des capteurs en cours...</p>
          </div>
        ) : (
          <div className="prose prose-sm prose-indigo">
            <p className="text-gray-700 leading-relaxed font-medium">
              {advice}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>Zone: {selectedZone.name}</span>
        <span>Mis à jour: {lastUpdate > 0 ? new Date(lastUpdate).toLocaleTimeString() : '-'}</span>
      </div>
    </div>
  );
};

export default AIAdvisor;