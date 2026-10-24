require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const apiRoutes = require('./routes/api');
const { startExpiryMonitor } = require('./services/expiryService');
const seed = require('./utils/seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Food Donation and Expiry Management API',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRoutes);

async function startServer() {
  try {
    // Ensure database tables and connection are ready
    await db.init();

    // Auto-seed if empty
    const userRow = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const userCount = userRow ? userRow.count : 0;
    if (userCount === 0) {
      console.log('[Init] Empty database detected. Running seed script...');
      await seed();
    }

    // Start background expiry monitoring engine (checks every 60s)
    startExpiryMonitor();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Food Donation & Expiry Management Server running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
