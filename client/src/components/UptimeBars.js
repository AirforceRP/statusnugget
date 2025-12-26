import React from 'react';

const UptimeBars = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="uptime-bars-empty">
        <p>No uptime data available yet</p>
      </div>
    );
  }

  // Get last 90 days, fill in missing days with 0
  const today = new Date();
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const existingData = data.find(d => d.date === dateStr);
    days.push({
      date: dateStr,
      uptime: existingData ? existingData.uptime : null,
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }

  return (
    <div className="uptime-bars-container">
      <div className="uptime-bars-header">
        <span className="bars-label">90-Day Uptime</span>
      </div>
      <div className="uptime-bars-grid">
        {days.map((day, index) => {
          const uptime = day.uptime !== null ? day.uptime : 100; // Assume up if no data
          const isUp = uptime >= 99;
          const isDegraded = uptime >= 95 && uptime < 99;
          const isDown = uptime < 95;
          
          return (
            <div 
              key={day.date} 
              className={`uptime-bar ${isUp ? 'bar-up' : isDegraded ? 'bar-degraded' : 'bar-down'} ${day.uptime === null ? 'bar-no-data' : ''}`}
              title={`${day.displayDate}: ${day.uptime !== null ? uptime.toFixed(2) + '%' : 'No data'}`}
            >
              <div className="bar-fill" style={{ height: `${uptime}%` }}></div>
            </div>
          );
        })}
      </div>
      <div className="uptime-bars-legend">
        <div className="legend-item">
          <span className="legend-color bar-up"></span>
          <span>Operational (≥99%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color bar-degraded"></span>
          <span>Degraded (95-99%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color bar-down"></span>
          <span>Down (&lt;95%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color bar-no-data"></span>
          <span>No Data</span>
        </div>
      </div>
    </div>
  );
};

export default UptimeBars;

