import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ServiceModal from './ServiceModal';
import IncidentModal from './IncidentModal';
import './Dashboard.css';

const Dashboard = () => {
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingIncident, setEditingIncident] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, incidentsRes] = await Promise.all([
        axios.get('/api/services'),
        axios.get('/api/incidents')
      ]);
      setServices(servicesRes.data);
      setIncidents(incidentsRes.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    try {
      await axios.delete(`/api/services/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  const handleDeleteIncident = async (id) => {
    if (!window.confirm('Are you sure you want to delete this incident?')) {
      return;
    }
    try {
      await axios.delete(`/api/incidents/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete incident');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleEditIncident = (incident) => {
    setEditingIncident(incident);
    setShowIncidentModal(true);
  };

  const handleModalClose = () => {
    setShowServiceModal(false);
    setShowIncidentModal(false);
    setEditingService(null);
    setEditingIncident(null);
  };

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
    return `${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={() => setShowServiceModal(true)}>
              Add Service
            </button>
            <button className="btn btn-primary" onClick={() => setShowIncidentModal(true)}>
              Create Incident
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="dashboard-section">
          <h2>Services ({services.length})</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Uptime (24h)</th>
                  <th>Last Check</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#666' }}>
                      No services yet. Add one to get started!
                    </td>
                  </tr>
                ) : (
                  services.map(service => (
                    <tr key={service.id}>
                      <td><strong>{service.name}</strong></td>
                      <td><a href={service.url} target="_blank" rel="noopener noreferrer">{service.url}</a></td>
                      <td>
                        <span className={`status-badge ${getStatusClass(service.status)}`}>
                          {service.status}
                        </span>
                      </td>
                      <td>{formatUptime(service.uptime_percentage)}</td>
                      <td>{service.last_check ? new Date(service.last_check).toLocaleString() : 'Never'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleEditService(service)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleDeleteService(service.id)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Incidents ({incidents.length})</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Severity</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#666' }}>
                      No incidents yet.
                    </td>
                  </tr>
                ) : (
                  incidents.map(incident => (
                    <tr key={incident.id}>
                      <td><strong>{incident.title}</strong></td>
                      <td>{incident.service_name || 'All Services'}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td>{incident.severity}</td>
                      <td>{new Date(incident.created_at).toLocaleString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleEditIncident(incident)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleDeleteIncident(incident.id)}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showServiceModal && (
        <ServiceModal
          service={editingService}
          onClose={handleModalClose}
          onSave={fetchData}
        />
      )}

      {showIncidentModal && (
        <IncidentModal
          incident={editingIncident}
          services={services}
          onClose={handleModalClose}
          onSave={fetchData}
        />
      )}
    </div>
  );
};

export default Dashboard;

