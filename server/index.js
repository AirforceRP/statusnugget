require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./database');
const monitoringService = require('./services/monitoring');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Error logging middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development for localhost
    return process.env.NODE_ENV !== 'production' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  }
});
app.use('/api/', limiter);

// Initialize database and start server
db.init()
  .then(() => {
    console.log('Database initialized');
    
    // Start monitoring service
    monitoringService.start();
    console.log('Monitoring service started');
    
    // Start server after database is ready
    app.listen(PORT, () => {
      console.log(`StatusNugget server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// API routes
app.use('/api', apiRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route - helpful message in development
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // This should be handled by the static file serving above
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  } else {
    res.json({
      message: 'StatusNugget API Server',
      status: 'running',
      endpoints: {
        health: '/health',
        api: '/api',
        services: '/api/services',
        incidents: '/api/incidents',
        publicStatus: '/api/public/status'
      },
      note: 'In development, access the React app at http://localhost:3000'
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  monitoringService.stop();
  db.close();
  process.exit(0);
});

