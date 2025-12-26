const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/statusnugget.db');

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
        // Create tables sequentially to ensure they're all created before resolving
      db.serialize(() => {
        let completed = 0;
        const total = 8; // 4 tables + 4 indexes
        
        const checkComplete = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        
        // Services table
        db.run(`CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'unknown',
          uptime_percentage REAL DEFAULT 100.0,
          last_check TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) {
            console.error('Error creating services table:', err);
            reject(err);
            return;
          }
          checkComplete();
        });

        // Status checks table
        db.run(`CREATE TABLE IF NOT EXISTS status_checks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER NOT NULL,
          status TEXT NOT NULL,
          response_time INTEGER,
          status_code INTEGER,
          error_message TEXT,
          checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id)
        )`, (err) => {
          if (err) {
            console.error('Error creating status_checks table:', err);
            reject(err);
            return;
          }
          checkComplete();
        });

        // Incidents table
        db.run(`CREATE TABLE IF NOT EXISTS incidents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'investigating',
          severity TEXT DEFAULT 'minor',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          resolved_at TEXT,
          FOREIGN KEY (service_id) REFERENCES services(id)
        )`, (err) => {
          if (err) {
            console.error('Error creating incidents table:', err);
            reject(err);
            return;
          }
          checkComplete();
        });

        // Create indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_status_checks_service_id ON status_checks(service_id)`, (err) => {
          if (err) {
            console.error('Error creating index:', err);
            reject(err);
            return;
          }
          checkComplete();
        });
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_status_checks_checked_at ON status_checks(checked_at)`, (err) => {
          if (err) {
            console.error('Error creating index:', err);
            reject(err);
            return;
          }
          checkComplete();
        });
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_incidents_service_id ON incidents(service_id)`, (err) => {
          if (err) {
            console.error('Error creating index:', err);
            reject(err);
            return;
          }
          checkComplete();
        });
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)`, (err) => {
          if (err) {
            console.error('Error creating index:', err);
            reject(err);
            return;
          }
          checkComplete();
        });

        // Subscriptions table
        db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT,
          phone TEXT,
          method TEXT NOT NULL,
          verified INTEGER DEFAULT 0,
          verification_token TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(email, method),
          UNIQUE(phone, method)
        )`, (err) => {
          if (err) {
            console.error('Error creating subscriptions table:', err);
            reject(err);
            return;
          }
          checkComplete();
        });
      });
    });
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return db;
};

const close = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  init,
  getDb,
  close
};

