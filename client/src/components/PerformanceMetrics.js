import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({ data, overall, days = 90 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="performance-empty">
        <p>No performance data available yet</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    avg: item.avgResponseTime || 0,
    min: item.minResponseTime || 0,
    max: item.maxResponseTime || 0,
    fullDate: item.date
  }));

  return (
    <div className="performance-metrics">
      <div className="performance-header">
        <h4 className="performance-title">Performance Metrics ({days}d)</h4>
      </div>
      {overall && (
        <div className="performance-stats">
          <div className="performance-stat">
            <span className="stat-label">Average</span>
            <span className="stat-value">{overall.avg ? `${overall.avg}ms` : 'N/A'}</span>
          </div>
          <div className="performance-stat">
            <span className="stat-label">Min</span>
            <span className="stat-value">{overall.min ? `${overall.min}ms` : 'N/A'}</span>
          </div>
          <div className="performance-stat">
            <span className="stat-label">Max</span>
            <span className="stat-value">{overall.max ? `${overall.max}ms` : 'N/A'}</span>
          </div>
        </div>
      )}
      
      <div className="performance-chart">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              style={{ fontSize: '11px' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '11px' }}
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '8px'
              }}
              formatter={(value, name) => {
                const labels = { avg: 'Avg', min: 'Min', max: 'Max' };
                return [`${value}ms`, labels[name] || name];
              }}
            />
            <Legend 
              formatter={(value) => {
                const labels = { avg: 'Average', min: 'Minimum', max: 'Maximum' };
                return labels[value] || value;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="avg" 
              stroke="#667eea" 
              strokeWidth={2}
              dot={false}
              name="avg"
            />
            <Line 
              type="monotone" 
              dataKey="min" 
              stroke="#10b981" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="5 5"
              name="min"
            />
            <Line 
              type="monotone" 
              dataKey="max" 
              stroke="#ef4444" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="5 5"
              name="max"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceMetrics;

