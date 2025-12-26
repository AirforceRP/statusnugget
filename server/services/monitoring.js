const axios = require('axios');
const cron = require('node-cron');
const db = require('../database');
const notifications = require('./notifications');

let checkInterval = null;
const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL) || 60000; // Default 1 minute

const checkService = async (service) => {
  const startTime = Date.now();
  let status = 'down';
  let responseTime = null;
  let statusCode = null;
  let errorMessage = null;

  try {
    const response = await axios.get(service.url, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status code
    });
    
    responseTime = Date.now() - startTime;
    statusCode = response.status;
    
    if (response.status >= 200 && response.status < 400) {
      status = 'up';
    } else {
      status = 'down';
      errorMessage = `HTTP ${response.status}`;
    }
  } catch (error) {
    responseTime = Date.now() - startTime;
    status = 'down';
    errorMessage = error.message;
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timeout';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS resolution failed';
    }
  }

  // Save status check
  const dbInstance = db.getDb();
  dbInstance.run(
    `INSERT INTO status_checks (service_id, status, response_time, status_code, error_message)
     VALUES (?, ?, ?, ?, ?)`,
    [service.id, status, responseTime, statusCode, errorMessage],
    (err) => {
      if (err) {
        console.error(`Error saving status check for service ${service.id}:`, err);
      }
    }
  );

  // Get old status before updating
  dbInstance.get('SELECT status FROM services WHERE id = ?', [service.id], (err, oldService) => {
    if (err) {
      console.error(`Error fetching old service status:`, err);
      return;
    }
    
    const oldStatus = oldService ? oldService.status : null;
    
    // Update service status
    dbInstance.run(
      `UPDATE services SET status = ?, last_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, service.id],
      (err) => {
        if (err) {
          console.error(`Error updating service ${service.id}:`, err);
        } else if (oldStatus && oldStatus !== status) {
          // Status changed, send notification
          dbInstance.get('SELECT * FROM services WHERE id = ?', [service.id], (err, updatedService) => {
            if (!err && updatedService) {
              notifications.checkAndNotify(updatedService);
            }
          });
        }
      }
    );
  });

  // Calculate uptime percentage (last 24 hours)
  calculateUptime(service.id);

  return { status, responseTime, statusCode, errorMessage };
};

const calculateUptime = (serviceId) => {
  const dbInstance = db.getDb();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  dbInstance.all(
    `SELECT status FROM status_checks 
     WHERE service_id = ? AND checked_at >= ? 
     ORDER BY checked_at DESC`,
    [serviceId, oneDayAgo],
    (err, rows) => {
      if (err) {
        console.error(`Error calculating uptime for service ${serviceId}:`, err);
        return;
      }

      if (rows.length === 0) {
        return;
      }

      const upCount = rows.filter(r => r.status === 'up').length;
      const uptimePercentage = (upCount / rows.length) * 100;

      dbInstance.run(
        `UPDATE services SET uptime_percentage = ? WHERE id = ?`,
        [uptimePercentage.toFixed(2), serviceId],
        (err) => {
          if (err) {
            console.error(`Error updating uptime for service ${serviceId}:`, err);
          }
        }
      );
    }
  );
};

const checkAllServices = async () => {
  const dbInstance = db.getDb();
  
  dbInstance.all(
    `SELECT * FROM services ORDER BY name`,
    async (err, services) => {
      if (err) {
        console.error('Error fetching services:', err);
        return;
      }

      if (services.length === 0) {
        return;
      }

      console.log(`Checking ${services.length} service(s)...`);
      
      for (const service of services) {
        await checkService(service);
        // Small delay between checks to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  );
};

const start = () => {
  if (checkInterval) {
    return; // Already running
  }

  // Initialize notification system
  notifications.initializeLastStatus();

  // Run immediately
  checkAllServices();

  // Then run on interval
  checkInterval = setInterval(() => {
    checkAllServices();
  }, CHECK_INTERVAL_MS);

  console.log(`Monitoring service started (checking every ${CHECK_INTERVAL_MS / 1000} seconds)`);
};

const stop = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('Monitoring service stopped');
  }
};

module.exports = {
  start,
  stop,
  checkService,
  checkAllServices
};

