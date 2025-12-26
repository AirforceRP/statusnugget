const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all services
router.get('/services', (req, res) => {
  const dbInstance = db.getDb();
  
  dbInstance.all(
    `SELECT * FROM services ORDER BY name`,
    (err, services) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(services);
    }
  );
});

// Get single service
router.get('/services/:id', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  
  dbInstance.get(
    `SELECT * FROM services WHERE id = ?`,
    [id],
    (err, service) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json(service);
    }
  );
});

// Create service
router.post('/services', (req, res) => {
  const dbInstance = db.getDb();
  const { name, url, description } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  dbInstance.run(
    `INSERT INTO services (name, url, description) VALUES (?, ?, ?)`,
    [name, url, description || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, name, url, description });
    }
  );
});

// Update service
router.put('/services/:id', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  const { name, url, description } = req.body;
  
  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  dbInstance.run(
    `UPDATE services SET name = ?, url = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, url, description || null, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json({ id, name, url, description });
    }
  );
});

// Delete service
router.delete('/services/:id', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  
  dbInstance.run(
    `DELETE FROM services WHERE id = ?`,
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json({ message: 'Service deleted' });
    }
  );
});

// Get status checks for a service
router.get('/services/:id/checks', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 100;
  
  dbInstance.all(
    `SELECT * FROM status_checks 
     WHERE service_id = ? 
     ORDER BY checked_at DESC 
     LIMIT ?`,
    [id, limit],
    (err, checks) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(checks);
    }
  );
});

// Get uptime data for a service (aggregated by day)
router.get('/services/:id/uptime', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  const days = parseInt(req.query.days) || 90;
  
  // Get checks from last N days, aggregated by day
  // SQLite uses date() function, not DATE()
  const daysParam = `-${days} days`;
  dbInstance.all(
    `SELECT 
      date(checked_at) as date,
      COUNT(*) as total_checks,
      SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) as up_checks,
      AVG(response_time) as avg_response_time
     FROM status_checks 
     WHERE service_id = ? 
       AND checked_at >= datetime('now', ?)
     GROUP BY date(checked_at)
     ORDER BY date ASC`,
    [id, daysParam],
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Calculate uptime percentage for each day
      const uptimeData = data.map(row => ({
        date: row.date,
        uptime: row.total_checks > 0 ? (row.up_checks / row.total_checks) * 100 : 0,
        totalChecks: row.total_checks,
        upChecks: row.up_checks,
        avgResponseTime: row.avg_response_time ? Math.round(row.avg_response_time) : null
      }));
      
      res.json(uptimeData);
    }
  );
});

// Get performance data for a service
router.get('/services/:id/performance', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  const days = parseInt(req.query.days) || 90;
  
  const daysParam = `-${days} days`;
  
  // Get performance metrics aggregated by day
  dbInstance.all(
    `SELECT 
      date(checked_at) as date,
      AVG(response_time) as avg_response_time,
      MIN(response_time) as min_response_time,
      MAX(response_time) as max_response_time,
      COUNT(*) as total_checks
     FROM status_checks 
     WHERE service_id = ? 
       AND checked_at >= datetime('now', ?)
       AND response_time IS NOT NULL
     GROUP BY date(checked_at)
     ORDER BY date ASC`,
    [id, daysParam],
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get overall stats
      dbInstance.all(
        `SELECT 
          AVG(response_time) as overall_avg,
          MIN(response_time) as overall_min,
          MAX(response_time) as overall_max,
          COUNT(*) as total_checks
         FROM status_checks 
         WHERE service_id = ? 
           AND checked_at >= datetime('now', ?)
           AND response_time IS NOT NULL`,
        [id, daysParam],
        (err, overall) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          const performanceData = data.map(row => ({
            date: row.date,
            avgResponseTime: row.avg_response_time ? Math.round(row.avg_response_time) : null,
            minResponseTime: row.min_response_time ? Math.round(row.min_response_time) : null,
            maxResponseTime: row.max_response_time ? Math.round(row.max_response_time) : null,
            totalChecks: row.total_checks
          }));
          
          const overallStats = overall[0] ? {
            avg: overall[0].overall_avg ? Math.round(overall[0].overall_avg) : null,
            min: overall[0].overall_min ? Math.round(overall[0].overall_min) : null,
            max: overall[0].overall_max ? Math.round(overall[0].overall_max) : null,
            totalChecks: overall[0].total_checks || 0
          } : { avg: null, min: null, max: null, totalChecks: 0 };
          
          res.json({
            daily: performanceData,
            overall: overallStats
          });
        }
      );
    }
  );
});

// RSS Feed endpoint
router.get('/rss', (req, res) => {
  const dbInstance = db.getDb();
  
  dbInstance.all(
    `SELECT s.name, s.status, s.last_check, i.* 
     FROM services s
     LEFT JOIN incidents i ON s.id = i.service_id
     WHERE i.status != 'resolved' OR i.status IS NULL
     ORDER BY COALESCE(i.created_at, s.last_check) DESC
     LIMIT 50`,
    [],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const baseUrl = req.protocol + '://' + req.get('host');
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>StatusNugget Status Feed</title>
    <link>${baseUrl}</link>
    <description>Status updates and incidents for monitored services</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${results.map(item => {
      if (item.title) {
        // Incident
        return `
    <item>
      <title>${item.title} - ${item.name || 'Service'}</title>
      <link>${baseUrl}/#incidents</link>
      <description>${item.description || 'No description'}</description>
      <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
      <guid>${baseUrl}/incidents/${item.id}</guid>
    </item>`;
      } else {
        // Service status
        return `
    <item>
      <title>${item.name} - ${item.status}</title>
      <link>${baseUrl}</link>
      <description>Service ${item.name} is currently ${item.status}</description>
      <pubDate>${new Date(item.last_check).toUTCString()}</pubDate>
      <guid>${baseUrl}/services/${item.id}</guid>
    </item>`;
      }
    }).join('')}
  </channel>
</rss>`;
      
      res.set('Content-Type', 'application/rss+xml');
      res.send(rss);
    }
  );
});

// Get public status (for status page)
router.get('/public/status', (req, res) => {
  try {
    const dbInstance = db.getDb();
    
    dbInstance.all(
      `SELECT id, name, url, description, status, uptime_percentage, last_check 
       FROM services 
       ORDER BY name`,
      (err, services) => {
        if (err) {
          console.error('Error fetching services:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Ensure services is an array
        const servicesList = services || [];
        
        // Get recent incidents (optional days parameter)
        const days = parseInt(req.query.days) || null;
        let incidentQuery;
        const incidentParams = [];
        
        if (days && !isNaN(days) && days > 0) {
          // Use datetime comparison - SQLite stores timestamps as TEXT
          incidentQuery = `SELECT i.*, s.name as service_name 
             FROM incidents i 
             LEFT JOIN services s ON i.service_id = s.id 
             WHERE datetime(i.created_at) >= datetime('now', '-${days} days')
             ORDER BY i.created_at DESC`;
        } else {
          // Default: only show unresolved incidents if no days specified
          incidentQuery = `SELECT i.*, s.name as service_name 
             FROM incidents i 
             LEFT JOIN services s ON i.service_id = s.id 
             WHERE (i.status IS NULL OR i.status != 'resolved')
             ORDER BY i.created_at DESC`;
        }
        
        dbInstance.all(incidentQuery, incidentParams, (err, incidents) => {
          if (err) {
            console.error('Error fetching incidents:', err);
            return res.status(500).json({ error: err.message });
          }
          
          try {
            res.json({
              services: servicesList,
              incidents: incidents || [],
              overall_status: servicesList.length > 0 && servicesList.every(s => s.status === 'up') ? 'operational' : 'degraded'
            });
          } catch (jsonErr) {
            console.error('Error sending response:', jsonErr);
            return res.status(500).json({ error: 'Failed to format response' });
          }
        });
      }
    );
  } catch (error) {
    console.error('Error in /public/status:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get incidents
router.get('/incidents', (req, res) => {
  const dbInstance = db.getDb();
  
  dbInstance.all(
    `SELECT i.*, s.name as service_name 
     FROM incidents i 
     LEFT JOIN services s ON i.service_id = s.id 
     ORDER BY i.created_at DESC`,
    (err, incidents) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(incidents);
    }
  );
});

// Create incident
router.post('/incidents', (req, res) => {
  const dbInstance = db.getDb();
  const { service_id, title, description, status, severity } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  dbInstance.run(
    `INSERT INTO incidents (service_id, title, description, status, severity) 
     VALUES (?, ?, ?, ?, ?)`,
    [service_id || null, title, description || null, status || 'investigating', severity || 'minor'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        id: this.lastID, 
        service_id, 
        title, 
        description, 
        status: status || 'investigating',
        severity: severity || 'minor'
      });
    }
  );
});

// Update incident
router.put('/incidents/:id', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  const { title, description, status, severity } = req.body;
  
  const updates = [];
  const values = [];
  
  if (title !== undefined) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
    if (status === 'resolved') {
      updates.push('resolved_at = CURRENT_TIMESTAMP');
    }
  }
  if (severity !== undefined) {
    updates.push('severity = ?');
    values.push(severity);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(id);
  
  dbInstance.run(
    `UPDATE incidents SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Incident not found' });
      }
      res.json({ message: 'Incident updated' });
    }
  );
});

// Delete incident
router.delete('/incidents/:id', (req, res) => {
  const dbInstance = db.getDb();
  const { id } = req.params;
  
  dbInstance.run(
    `DELETE FROM incidents WHERE id = ?`,
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Incident not found' });
      }
      res.json({ message: 'Incident deleted' });
    }
  );
});

// Get available subscription methods
router.get('/subscriptions/methods', (req, res) => {
  try {
    const methods = [];
    
    // Always show email option (even if not configured, user can still subscribe)
    const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    methods.push({ 
      type: 'email', 
      label: 'Email', 
      available: true,
      configured: emailConfigured
    });
    
    // Always show SMS option (even if not configured, user can still subscribe)
    const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ||
                          !!(process.env.CLICKSEND_USERNAME && process.env.CLICKSEND_API_KEY);
    methods.push({ 
      type: 'sms', 
      label: 'SMS', 
      available: true,
      configured: smsConfigured
    });
    
    // RSS is always available
    methods.push({ type: 'rss', label: 'RSS Feed', available: true, configured: true });
    
    res.json({ methods });
  } catch (error) {
    console.error('Error getting subscription methods:', error);
    // Return default methods even on error
    res.json({ 
      methods: [
        { type: 'email', label: 'Email', available: true, configured: false },
        { type: 'sms', label: 'SMS', available: true, configured: false },
        { type: 'rss', label: 'RSS Feed', available: true, configured: true }
      ] 
    });
  }
});

// Create subscription
router.post('/subscriptions', (req, res) => {
  const dbInstance = db.getDb();
  const { email, phone, method } = req.body;
  
  if (!method) {
    return res.status(400).json({ error: 'Method is required' });
  }
  
  if (method === 'email' && !email) {
    return res.status(400).json({ error: 'Email is required for email subscriptions' });
  }
  
  if (method === 'sms' && !phone) {
    return res.status(400).json({ error: 'Phone number is required for SMS subscriptions' });
  }
  
  // Validate email format
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate phone format (basic)
  if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }
  
  // Generate verification token
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  
  dbInstance.run(
    `INSERT INTO subscriptions (email, phone, method, verification_token) 
     VALUES (?, ?, ?, ?)`,
    [email || null, phone || null, method, verificationToken],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(409).json({ error: 'Already subscribed with this contact method' });
        }
        console.error('Error creating subscription:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Send verification if needed
      if (method === 'email' && email) {
        // TODO: Send verification email
        console.log(`Verification email should be sent to ${email} with token ${verificationToken}`);
      } else if (method === 'sms' && phone) {
        // TODO: Send verification SMS
        console.log(`Verification SMS should be sent to ${phone} with token ${verificationToken}`);
      }
      
      res.status(201).json({ 
        id: this.lastID,
        message: method === 'rss' ? 'RSS feed available' : 'Subscription created. Please verify your contact information.',
        verificationRequired: method !== 'rss'
      });
    }
  );
});

module.exports = router;

