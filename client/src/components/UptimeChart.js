import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const UptimeChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="uptime-chart-empty">
        <p>No uptime data available yet</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uptime: parseFloat(item.uptime.toFixed(2)),
    fullDate: item.date
  }));

  return (
    <div className="uptime-chart-container">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38ef7d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#38ef7d" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            style={{ fontSize: '11px' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[0, 100]}
            stroke="#666"
            style={{ fontSize: '11px' }}
            label={{ value: 'Uptime %', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px'
            }}
            formatter={(value) => [`${value.toFixed(2)}%`, 'Uptime']}
          />
          <Area 
            type="monotone" 
            dataKey="uptime" 
            stroke="#11998e" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUptime)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UptimeChart;

