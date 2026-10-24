const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../food_donation.db');

let rawDb = null;
let inTransaction = false;

// Helper to persist in-memory database state to SQLite file on disk
function saveToDisk() {
  if (!rawDb || inTransaction) return;
  try {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('[Database] Failed to save database to disk:', err.message);
  }
}

// Convert params to flat array if passed as individual args
function normalizeParams(params) {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

const dbWrapper = {
  isReady: false,

  async init() {
    if (this.isReady) return;

    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(dbPath);
        rawDb = new SQL.Database(fileBuffer);
      } catch (e) {
        console.warn('[Database] Could not read existing db, creating fresh instance:', e.message);
        rawDb = new SQL.Database();
      }
    } else {
      rawDb = new SQL.Database();
    }

    rawDb.run('PRAGMA foreign_keys = ON;');
    this.createTables();
    try {
      rawDb.run('ALTER TABLE users ADD COLUMN address TEXT;');
    } catch (e) {
      // Column already exists
    }
    saveToDisk();
    this.isReady = true;
  },

  createTables() {
    rawDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('donor', 'ngo', 'volunteer', 'admin')) NOT NULL,
        phone TEXT,
        city TEXT DEFAULT 'Bengaluru',
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ngos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        ngo_name TEXT NOT NULL,
        registration_number TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        availability_status TEXT DEFAULT 'available',
        preferred_areas TEXT,
        total_deliveries INTEGER DEFAULT 0,
        hours_contributed REAL DEFAULT 0,
        total_earnings REAL DEFAULT 0,
        upi_id TEXT DEFAULT 'volunteer@upi',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL,
        food_name TEXT NOT NULL,
        food_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        quantity_unit TEXT NOT NULL DEFAULT 'servings',
        preparation_datetime DATETIME NOT NULL,
        expiry_datetime DATETIME NOT NULL,
        pickup_location TEXT NOT NULL,
        city TEXT NOT NULL,
        safety_checklist TEXT,
        image_url TEXT,
        notes TEXT,
        status TEXT CHECK(status IN ('posted', 'accepted', 'assigned', 'picked_up', 'delivered', 'expired', 'cancelled')) DEFAULT 'posted',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS donation_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donation_id INTEGER NOT NULL UNIQUE,
        ngo_id INTEGER NOT NULL,
        volunteer_id INTEGER,
        collection_type TEXT CHECK(collection_type IN ('volunteer', 'ngo_team')) NOT NULL DEFAULT 'ngo_team',
        beneficiaries_served INTEGER DEFAULT 0,
        payout_amount REAL DEFAULT 250.0,
        payout_status TEXT DEFAULT 'paid',
        accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        picked_up_at DATETIME,
        delivered_at DATETIME,
        delivery_notes TEXT,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
        FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        email_sent INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donation_id INTEGER,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS evaluation_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario TEXT NOT NULL,
        task_name TEXT NOT NULL,
        participant_id TEXT,
        time_taken_seconds REAL NOT NULL,
        errors_count INTEGER DEFAULT 0,
        completed_successfully INTEGER DEFAULT 1,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration guards for columns in existing databases
    try { rawDb.run("ALTER TABLE users ADD COLUMN city TEXT DEFAULT 'Bengaluru';"); } catch (e) {}
    try { rawDb.run("ALTER TABLE volunteers ADD COLUMN upi_id TEXT DEFAULT 'volunteer@upi';"); } catch (e) {}
    try { rawDb.run("ALTER TABLE volunteers ADD COLUMN total_earnings REAL DEFAULT 0;"); } catch (e) {}
    try { rawDb.run("ALTER TABLE donation_assignments ADD COLUMN payout_amount REAL DEFAULT 250.0;"); } catch (e) {}
    try { rawDb.run("ALTER TABLE donation_assignments ADD COLUMN payout_status TEXT DEFAULT 'paid';"); } catch (e) {}
  },

  exec(sql) {
    if (!rawDb) throw new Error('Database not initialized');
    rawDb.run(sql);
    saveToDisk();
  },

  pragma(cmd) {
    if (!rawDb) return;
    try {
      rawDb.run(`PRAGMA ${cmd}`);
    } catch (e) {}
  },

  prepare(sql) {
    if (!rawDb) throw new Error('Database not initialized');

    return {
      get: (...args) => {
        const params = normalizeParams(args);
        const stmt = rawDb.prepare(sql);
        try {
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      all: (...args) => {
        const params = normalizeParams(args);
        const stmt = rawDb.prepare(sql);
        const results = [];
        try {
          if (params.length > 0) stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          return results;
        } finally {
          stmt.free();
        }
      },

      run: (...args) => {
        const params = normalizeParams(args);
        rawDb.run(sql, params);
        
        // Retrieve last insert row id and changes
        let lastInsertRowid = 0;
        try {
          const res = rawDb.exec('SELECT last_insert_rowid() AS id');
          if (res.length > 0 && res[0].values.length > 0) {
            lastInsertRowid = res[0].values[0][0];
          }
        } catch (e) {}

        const changes = rawDb.getRowsModified ? rawDb.getRowsModified() : 1;
        saveToDisk();

        return { lastInsertRowid, changes };
      }
    };
  },

  transaction(fn) {
    return (...args) => {
      if (!rawDb) throw new Error('Database not initialized');
      if (inTransaction) {
        return fn(...args);
      }

      inTransaction = true;
      rawDb.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        rawDb.run('COMMIT');
        inTransaction = false;
        saveToDisk();
        return result;
      } catch (err) {
        inTransaction = false;
        try {
          rawDb.run('ROLLBACK');
        } catch (rollbackErr) {
          // If transaction was already inactive, ignore rollback failure
        }
        throw err;
      }
    };
  }
};

module.exports = dbWrapper;
