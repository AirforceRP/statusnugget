import React from 'react';
import './HorizontalUptimeBars.css';

const HorizontalUptimeBars = ({ data, days = 90 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="horizontal-uptime-bars-empty">
        <p>No uptime data available yet</p>
      </div>
    );
  }

  // Get last N days, fill in missing days
  const today = new Date();
  const dayData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const existingData = data.find(d => d.date === dateStr);
    dayData.push({
      date: dateStr,
      uptime: existingData ? existingData.uptime : null,
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }

  return (
    <div className="horizontal-uptime-bars">
      <div className="horizontal-bars-grid" data-days={days}>
        {dayData.map((day, index) => {
          const uptime = day.uptime !== null ? day.uptime : 100;
          const isUp = uptime >= 99;
          const isDegraded = uptime >= 95 && uptime < 99;
          const isDown = uptime < 95;
          
          return (
            <div 
              key={day.date} 
              className={`horizontal-bar ${isUp ? 'bar-up' : isDegraded ? 'bar-degraded' : 'bar-down'} ${day.uptime === null ? 'bar-no-data' : ''}`}
              title={`${day.displayDate}: ${day.uptime !== null ? uptime.toFixed(3) + '%' : 'No data'}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalUptimeBars;

