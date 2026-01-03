import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SensorData } from '../types';

interface SensorChartProps {
  data: SensorData[];
  color: string;
  dataKey: keyof SensorData;
  unit: string;
}

const SensorChart: React.FC<SensorChartProps> = ({ data, color, dataKey, unit }) => {
  // Format data for display
  const formattedData = data.map(d => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    val: Number(d[dataKey].toFixed(1))
  }));

  if (formattedData.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">En attente de données...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis 
          dataKey="time" 
          stroke="#94a3b8" 
          fontSize={10} 
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis 
          stroke="#94a3b8" 
          fontSize={10} 
          tickLine={false} 
          unit={unit}
          domain={['auto', 'auto']}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          labelStyle={{ color: '#64748b', fontSize: '12px' }}
          itemStyle={{ color: color, fontWeight: 600 }}
        />
        <Line 
          type="monotone" 
          dataKey="val" 
          stroke={color} 
          strokeWidth={2} 
          dot={false} 
          activeDot={{ r: 4 }}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SensorChart;