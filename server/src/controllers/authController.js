const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const notificationService = require('../services/notificationService');

/**
 * Register a new user
 * Enforces mandatory city for all roles (Donor, NGO, Volunteer, Admin)
 */
function register(req, res) {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      city, 
      ngoName, 
      registrationNumber, 
      address, 
      preferredAreas,
      upi_id 
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City / Location is mandatory for registration. All users must specify their city (e.g. Mumbai, Bengaluru, Pune).' });
    }

    if (!['donor', 'ngo', 'volunteer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const cleanCity = city.trim();

    const insertTx = db.transaction(() => {
      const userResult = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, city)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name.trim(), email.toLowerCase().trim(), passwordHash, role, phone ? phone.trim() : null, cleanCity);

      const userId = userResult.lastInsertRowid;

      if (role === 'ngo') {
        if (!ngoName || !address) {
          throw new Error('NGO Name and headquarters address are required for NGO accounts');
        }
        db.prepare(`
          INSERT INTO ngos (user_id, ngo_name, registration_number, address, city, verified)
          VALUES (?, ?, ?, ?, ?, 0)
        `).run(userId, ngoName.trim(), registrationNumber ? registrationNumber.trim() : null, address.trim(), cleanCity);
      } else if (role === 'volunteer') {
        db.prepare(`
          INSERT INTO volunteers (user_id, availability_status, preferred_areas, upi_id, total_earnings)
          VALUES (?, 'available', ?, ?, 0)
        `).run(userId, preferredAreas ? preferredAreas.trim() : cleanCity, upi_id ? upi_id.trim() : 'volunteer@upi');
      }

      return userId;
    });

    const newUserId = insertTx();
    const newUser = db.prepare('SELECT id, name, email, role, phone, city, created_at FROM users WHERE id = ?').get(newUserId);
    
    // Generate token
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    let profile = null;
    if (role === 'ngo') {
      profile = db.prepare('SELECT * FROM ngos WHERE user_id = ?').get(newUser.id);
    } else if (role === 'volunteer') {
      profile = db.prepare('SELECT * FROM volunteers WHERE user_id = ?').get(newUser.id);
    }

    // Send Welcome Notification & Simulated Email
    notificationService.sendNotification({
      userId: newUserId,
      title: `Welcome to FoodRescueHub, ${name.trim()}!`,
      message: `Your ${role.toUpperCase()} account has been registered in ${cleanCity}. You will receive real-time notifications for food redistribution in your city zone.`,
      type: 'info'
    });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { ...newUser, profile }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
}

/**
 * User login
 */
function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    let profile = null;
    if (user.role === 'ngo') {
      profile = db.prepare('SELECT * FROM ngos WHERE user_id = ?').get(user.id);
    } else if (user.role === 'volunteer') {
      profile = db.prepare('SELECT * FROM volunteers WHERE user_id = ?').get(user.id);
    }

    const { password_hash, ...safeUser } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: { ...safeUser, profile }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
}

/**
 * Get current authenticated user profile
 */
function getCurrentUser(req, res) {
  try {
    const user = req.user;
    let profile = null;
    if (user.role === 'ngo') {
      profile = db.prepare('SELECT * FROM ngos WHERE user_id = ?').get(user.id);
    } else if (user.role === 'volunteer') {
      profile = db.prepare('SELECT * FROM volunteers WHERE user_id = ?').get(user.id);
    }

    return res.json({
      user: { ...user, profile }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Update authenticated user profile (Common, Donor, NGO, Volunteer)
 */
function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { 
      name, 
      phone, 
      city, 
      address, 
      ngo_name, 
      registration_number, 
      upi_id, 
      preferred_areas,
      availability_status 
    } = req.body;

    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (city !== undefined && (!city || !city.trim())) {
      return res.status(400).json({ error: 'City / Location cannot be empty' });
    }

    const updateTx = db.transaction(() => {
      // 1. Update users table
      const updatedName = name !== undefined && name.trim() ? name.trim() : existingUser.name;
      const updatedPhone = phone !== undefined ? (phone ? phone.trim() : null) : existingUser.phone;
      const updatedCity = city !== undefined && city.trim() ? city.trim() : existingUser.city;
      const updatedAddress = address !== undefined ? (address ? address.trim() : null) : existingUser.address;

      db.prepare(`
        UPDATE users 
        SET name = ?, phone = ?, city = ?, address = ?
        WHERE id = ?
      `).run(updatedName, updatedPhone, updatedCity, updatedAddress, userId);

      // 2. Role-specific profile updates
      if (role === 'ngo') {
        const ngo = db.prepare('SELECT * FROM ngos WHERE user_id = ?').get(userId);
        if (ngo) {
          const updatedNgoName = ngo_name !== undefined && ngo_name.trim() ? ngo_name.trim() : ngo.ngo_name;
          const updatedRegNo = registration_number !== undefined ? (registration_number ? registration_number.trim() : null) : ngo.registration_number;
          const updatedNgoAddress = address !== undefined && address.trim() ? address.trim() : ngo.address;
          const updatedNgoCity = updatedCity || ngo.city;

          db.prepare(`
            UPDATE ngos 
            SET ngo_name = ?, registration_number = ?, address = ?, city = ?
            WHERE user_id = ?
          `).run(updatedNgoName, updatedRegNo, updatedNgoAddress, updatedNgoCity, userId);
        }
      } else if (role === 'volunteer') {
        const vol = db.prepare('SELECT * FROM volunteers WHERE user_id = ?').get(userId);
        if (vol) {
          const updatedUpi = upi_id !== undefined && upi_id.trim() ? upi_id.trim() : vol.upi_id;
          const updatedAreas = preferred_areas !== undefined ? (preferred_areas ? preferred_areas.trim() : null) : vol.preferred_areas;
          const updatedStatus = (availability_status && ['available', 'busy', 'offline'].includes(availability_status)) 
            ? availability_status 
            : vol.availability_status;

          db.prepare(`
            UPDATE volunteers 
            SET upi_id = ?, preferred_areas = ?, availability_status = ?
            WHERE user_id = ?
          `).run(updatedUpi, updatedAreas, updatedStatus, userId);
        }
      }

      db.prepare(`
        INSERT INTO activity_logs (user_id, action, details)
        VALUES (?, 'PROFILE_UPDATED', ?)
      `).run(userId, `${existingUser.name} updated their ${role.toUpperCase()} profile information.`);
    });

    updateTx();

    // Fetch updated user record
    const updatedUser = db.prepare('SELECT id, name, email, role, phone, city, address, created_at FROM users WHERE id = ?').get(userId);
    let profile = null;
    if (updatedUser.role === 'ngo') {
      profile = db.prepare('SELECT * FROM ngos WHERE user_id = ?').get(updatedUser.id);
    } else if (updatedUser.role === 'volunteer') {
      profile = db.prepare('SELECT * FROM volunteers WHERE user_id = ?').get(updatedUser.id);
    }

    return res.json({
      message: 'Profile information updated successfully!',
      user: { ...updatedUser, profile }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
}

/**
 * List available demo accounts for testing
 */
function getDemoAccounts(req, res) {
  try {
    const demoUsers = db.prepare(`
      SELECT id, name, email, role, phone, city 
      FROM users 
      WHERE email LIKE '%@donor.in' OR email LIKE '%@ngo.in' OR email LIKE '%@seva.in' OR email LIKE '%@foodaid.in'
      ORDER BY id ASC
    `).all();

    return res.json({ accounts: demoUsers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  getDemoAccounts
};
