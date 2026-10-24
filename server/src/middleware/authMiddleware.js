const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_food_donation_jwt_key_2026_msc';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user record including city and address
    const user = db.prepare('SELECT id, name, email, role, phone, city, address FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or deleted' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth: populates req.user if valid token provided, but doesn't block guests
function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, phone, city, address FROM users WHERE id = ?').get(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid token on optional routes
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  JWT_SECRET
};
