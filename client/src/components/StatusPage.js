import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HorizontalUptimeBars from './HorizontalUptimeBars';
import PerformanceMetrics from './PerformanceMetrics';
import SubscribeModal from './SubscribeModal';
import './StatusPage.css';
import './DarkMode.css';

const StatusPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uptimeData, setUptimeData] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [activeTab, setActiveTab] = useState('uptime');
  const [timeframe, setTimeframe] = useState(90);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/public/status', { params: { days: timeframe } });
      setData(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      const errorMessage = err.response 
        ? `Failed to load status: ${err.response.status} ${err.response.statusText}`
        : err.message === 'Network Error' 
        ? 'Cannot connect to backend server. Make sure it\'s running on port 3001.'
        : `Failed to load status: ${err.message}`;
      setError(errorMessage);
      setLoading(false);
    }
  };

  const fetchUptimeData = async () => {
    if (!data || !data.services) return;
    
    const uptimePromises = data.services.map(service =>
      axios.get(`/api/services/${service.id}/uptime`, { params: { days: timeframe } })
        .then(response => ({ serviceId: service.id, data: response.data }))
        .catch(err => ({ serviceId: service.id, data: [] }))
    );
    
    try {
      const results = await Promise.all(uptimePromises);
      const uptimeMap = {};
      results.forEach(result => {
        uptimeMap[result.serviceId] = result.data;
      });
      setUptimeData(uptimeMap);
    } catch (err) {
      console.error('Failed to fetch uptime data:', err);
    }
  };

  const fetchPerformanceData = async () => {
    if (!data || !data.services) return;
    
    const performancePromises = data.services.map(service =>
      axios.get(`/api/services/${service.id}/performance`, { params: { days: timeframe } })
        .then(response => ({ serviceId: service.id, data: response.data }))
        .catch(err => ({ serviceId: service.id, data: { daily: [], overall: null } }))
    );
    
    try {
      const results = await Promise.all(performancePromises);
      const performanceMap = {};
      results.forEach(result => {
        performanceMap[result.serviceId] = result.data;
      });
      setPerformanceData(performanceMap);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every 1 minute
    return () => clearInterval(interval);
  }, [timeframe]);

  useEffect(() => {
    if (data && data.services) {
      fetchUptimeData();
      fetchPerformanceData();
    }
  }, [data, timeframe]);

  // Refresh uptime data every minute
  useEffect(() => {
    if (!data || !data.services) return;
    
    const uptimeInterval = setInterval(() => {
      fetchUptimeData();
      fetchPerformanceData();
    }, 60000); // Refresh every 1 minute
    
    return () => clearInterval(uptimeInterval);
  }, [data, timeframe]);

  if (loading) {
    return <div className="container"><div className="loading">Loading status...</div></div>;
  }

  if (error) {
    return (
      <div className="status-page-flare">
        <div className="container">
          <div className="error-message">
            <h2>Failed to load status</h2>
            <p>Please make sure the backend server is running on port 3001</p>
            <p className="error-details">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'up': return 'status-up';
      case 'down': return 'status-down';
      case 'degraded': return 'status-degraded';
      default: return 'status-unknown';
    }
  };

  const formatUptime = (percentage) => {
    if (percentage === null || percentage === undefined) return 'N/A';
    return `${percentage.toFixed(3)}%`;
  };

  const calculateOverallUptime = (serviceId) => {
    const serviceData = uptimeData[serviceId] || [];
    if (serviceData.length === 0) return null;
    
    const daysToUse = Math.min(timeframe, serviceData.length);
    const recentData = serviceData.slice(-daysToUse);
    const totalUptime = recentData.reduce((sum, day) => sum + day.uptime, 0);
    return totalUptime / recentData.length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const getAllDatesInRange = () => {
    const dates = [];
    const today = new Date();
    const options = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    for (let i = timeframe - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push({
        dateStr: dateStr,
        displayDate: date.toLocaleDateString('en-US', options)
      });
    }
    
    // Reverse to show newest dates first
    return dates.reverse();
  };

  const groupIncidentsByDate = () => {
    const dateMap = {};
    
    // Initialize all dates with empty incidents
    getAllDatesInRange().forEach(({ dateStr, displayDate }) => {
      dateMap[dateStr] = {
        displayDate,
        incidents: []
      };
    });
    
    // Add incidents to their respective dates
    if (filteredIncidents && filteredIncidents.length > 0) {
      filteredIncidents.forEach(incident => {
        if (incident.created_at) {
          const incidentDate = new Date(incident.created_at).toISOString().split('T')[0];
          if (dateMap[incidentDate]) {
            dateMap[incidentDate].incidents.push(incident);
          }
        }
      });
    }
    
    // Sort incidents within each date by created_at (newest first)
    Object.keys(dateMap).forEach(dateStr => {
      dateMap[dateStr].incidents.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
    });
    
    return dateMap;
  };

  const isOperational = data && data.overall_status === 'operational';
  
  // Filter incidents for the selected timeframe
  // The API already filters by timeframe, so we can use all incidents returned
  const filteredIncidents = data && data.incidents ? data.incidents : [];
  
  // Group incidents by date for display
  const incidentsByDate = groupIncidentsByDate();

  return (
    <div className="status-page-flare">
      <div className="status-page-header">
        <div className="status-page-top">
          <div className="status-logo">StatusNugget</div>
          <a href="/api/rss" className="rss-feed-btn" download="statusnugget-feed.xml">
            RSS feed
          </a>
        </div>
        
        <div className="status-indicator">
          <div className={`status-circle ${isOperational ? 'status-operational' : 'status-degraded'}`}>
            {isOperational ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="white"/>
              </svg>
            )}
          </div>
          <h1 className="status-title">{isOperational ? 'Services Fully Operational' : 'Degraded'}</h1>
          <a href="#incidents" className="incident-history-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('incidents-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>Incident History +</a>
        </div>
      </div>

      <div className="live-status-section">
        <div className="live-status-header">
          <h2 className="live-status-title">Live Status</h2>
          <div className="timeframe-selector">
            <button 
              className={`timeframe-btn ${timeframe === 7 ? 'active' : ''}`}
              onClick={() => setTimeframe(7)}
            >
              7d
            </button>
            <button 
              className={`timeframe-btn ${timeframe === 30 ? 'active' : ''}`}
              onClick={() => setTimeframe(30)}
            >
              30d
            </button>
            <button 
              className={`timeframe-btn ${timeframe === 90 ? 'active' : ''}`}
              onClick={() => setTimeframe(90)}
            >
              90d
            </button>
          </div>
        </div>

        <div className="status-tabs">
          <button 
            className={`status-tab ${activeTab === 'uptime' ? 'active' : ''}`}
            onClick={() => setActiveTab('uptime')}
          >
            Uptime
          </button>
          <button 
            className={`status-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        </div>

        <div className="services-list">
          {data.services && data.services.map(service => {
            const overallUptime = calculateOverallUptime(service.id);
            const serviceUptime = overallUptime !== null ? overallUptime : (service.uptime_percentage || 0);
            
            return (
              <div key={service.id} className="service-item">
                <div className="service-item-header">
                  <div className="service-name-section">
                    <div className={`service-status-icon ${getStatusClass(service.status)}`}>
                      {service.status === 'up' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                        </svg>
                      )}
                    </div>
                    <span className="service-name">{service.name}</span>
                  </div>
                  <div className="service-uptime-percentage">
                    {formatUptime(serviceUptime)}
                  </div>
                </div>
                {activeTab === 'uptime' && (
                  <HorizontalUptimeBars data={uptimeData[service.id] || []} days={timeframe} />
                )}
                {activeTab === 'performance' && (
                  <PerformanceMetrics 
                    data={performanceData[service.id]?.daily || []} 
                    overall={performanceData[service.id]?.overall || null}
                    days={timeframe}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div id="incidents-section" className="incidents-section-flare">
        <h2 className="incidents-section-title">Past Incidents</h2>
        <div className="past-incidents-list">
          {Object.values(incidentsByDate).map(({ displayDate, incidents }, index) => (
            <div key={index} className="incident-date-group">
              <div className="incident-date-header">
                <h3 className="incident-date-title">{displayDate}</h3>
              </div>
              {incidents.length === 0 ? (
                <div className="incident-date-content">
                  <p className="no-incidents-text">No incidents reported.</p>
                </div>
              ) : (
                <div className="incident-date-content">
                  {incidents.map(incident => (
                    <div key={incident.id} className="incident-update">
                      <div className="incident-update-header">
                        <span className={`incident-status-badge ${getStatusClass(incident.status)}`}>
                          {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </span>
                        {incident.title && (
                          <span className="incident-update-title"> - {incident.title}</span>
                        )}
                        {incident.service_name && (
                          <span className="incident-service-badge">{incident.service_name}</span>
                        )}
                      </div>
                      {incident.description && (
                        <p className="incident-update-description">{incident.description}</p>
                      )}
                      <p className="incident-update-time">
                        {formatDateTime(incident.created_at)}
                        {incident.resolved_at && incident.status === 'resolved' && (
                          <span> - Resolved: {formatDateTime(incident.resolved_at)}</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="subscribe-section">
        <button 
          className="subscribe-button" 
          onClick={() => setSubscribeModalOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.5 21C5.67 21 5 20.33 5 19.5C5 18.67 5.67 18 6.5 18C7.33 18 8 18.67 8 19.5C8 20.33 7.33 21 6.5 21ZM6.5 16C4.01 16 2 18.01 2 20.5C2 22.99 4.01 25 6.5 25C8.99 25 11 22.99 11 20.5C11 18.01 8.99 16 6.5 16ZM19 21C18.17 21 17.5 20.33 17.5 19.5C17.5 18.67 18.17 18 19 18C19.83 18 20.5 18.67 20.5 19.5C20.5 20.33 19.83 21 19 21ZM19 16C16.51 16 14.5 18.01 14.5 20.5C14.5 22.99 16.51 25 19 25C21.49 25 23.5 22.99 23.5 20.5C23.5 18.01 21.49 16 19 16ZM6.5 8C7.33 8 8 7.33 8 6.5C8 5.67 7.33 5 6.5 5C5.67 5 5 5.67 5 6.5C5 7.33 5.67 8 6.5 8ZM6.5 3C8.99 3 11 5.01 11 7.5C11 9.99 8.99 12 6.5 12C4.01 12 2 9.99 2 7.5C2 5.01 4.01 3 6.5 3ZM19 8C19.83 8 20.5 7.33 20.5 6.5C20.5 5.67 19.83 5 19 5C18.17 5 17.5 5.67 17.5 6.5C17.5 7.33 18.17 8 19 8ZM19 3C21.49 3 23.5 5.01 23.5 7.5C23.5 9.99 21.49 12 19 12C16.51 12 14.5 9.99 14.5 7.5C14.5 5.01 16.51 3 19 3ZM6.5 14.5C6.5 14.5 4 15.5 4 17.5H9C9 15.5 6.5 14.5 6.5 14.5ZM19 14.5C19 14.5 16.5 15.5 16.5 17.5H21.5C21.5 15.5 19 14.5 19 14.5ZM6.5 6.5C6.5 6.5 4 7.5 4 9.5H9C9 7.5 6.5 6.5 6.5 6.5ZM19 6.5C19 6.5 16.5 7.5 16.5 9.5H21.5C21.5 7.5 19 6.5 19 6.5Z" fill="currentColor"/>
          </svg>
          Subscribe for updates
        </button>
      </div>

      <SubscribeModal 
        isOpen={subscribeModalOpen} 
        onClose={() => setSubscribeModalOpen(false)} 
      />
    </div>
  );
};

export default StatusPage;

