const db = require('../config/database');
const { getUrgencyInfo, checkAndUpdateExpiredDonations } = require('../services/expiryService');
const notificationService = require('../services/notificationService');

/**
 * Create a new donation (Donor role)
 * Associates donation with donor's registered city
 */
function createDonation(req, res) {
  try {
    const donorId = req.user.id;
    const {
      food_name,
      food_type,
      quantity,
      quantity_unit,
      preparation_datetime,
      expiry_datetime,
      pickup_location,
      city,
      safety_checklist,
      image_url,
      notes
    } = req.body;

    const donationCity = (city || req.user.city || 'Bengaluru').trim();

    if (!food_name || !food_type || !quantity || !preparation_datetime || !expiry_datetime || !pickup_location) {
      return res.status(400).json({ error: 'Missing required donation fields' });
    }

    const prepDate = new Date(preparation_datetime);
    const expiryDate = new Date(expiry_datetime);
    const now = new Date();

    if (isNaN(prepDate.getTime()) || isNaN(expiryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date/time format' });
    }

    if (expiryDate <= now) {
      return res.status(400).json({ error: 'Expiry date and time must be in the future' });
    }

    if (expiryDate <= prepDate) {
      return res.status(400).json({ error: 'Expiry time cannot be earlier than preparation time' });
    }

    // Insert donation
    const insertStmt = db.prepare(`
      INSERT INTO donations (
        donor_id, food_name, food_type, quantity, quantity_unit,
        preparation_datetime, expiry_datetime, pickup_location, city,
        safety_checklist, image_url, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted')
    `);

    const checklistStr = typeof safety_checklist === 'object' ? JSON.stringify(safety_checklist) : (safety_checklist || null);

    const result = insertStmt.run(
      donorId,
      food_name.trim(),
      food_type,
      parseFloat(quantity),
      quantity_unit || 'servings',
      expiryDate > prepDate ? prepDate.toISOString() : new Date().toISOString(),
      expiryDate.toISOString(),
      pickup_location.trim(),
      donationCity,
      checklistStr,
      image_url || null,
      notes ? notes.trim() : null
    );

    const newDonationId = result.lastInsertRowid;

    // Log activity
    db.prepare(`
      INSERT INTO activity_logs (donation_id, user_id, action, details)
      VALUES (?, ?, 'DONATION_POSTED', ?)
    `).run(newDonationId, donorId, `Posted ${quantity} ${quantity_unit || 'servings'} of "${food_name}" in ${donationCity}`);

    const createdDonation = db.prepare('SELECT * FROM donations WHERE id = ?').get(newDonationId);
    const urgency = getUrgencyInfo(createdDonation.expiry_datetime);

    // Notify all verified NGOs registered in this city & simulate email dispatch
    notificationService.notifyNewDonationPosted(createdDonation);

    return res.status(201).json({
      message: `Donation successfully posted and broadcasted to verified NGOs in ${donationCity}`,
      donation: { ...createdDonation, urgency }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to post donation' });
  }
}

/**
 * Get available donations for NGOs to claim
 * Strict City Geo-fencing: Authenticated users only see donations in their registered city zone
 */
function getAvailableDonations(req, res) {
  try {
    // Run automated expiry checker first
    checkAndUpdateExpiredDonations();

    const { city, food_type, urgency, search } = req.query;

    let query = `
      SELECT d.*, u.name as donor_name, u.phone as donor_phone
      FROM donations d
      JOIN users u ON d.donor_id = u.id
      WHERE d.status = 'posted'
    `;
    const params = [];

    // Enforce registered city zone for authenticated non-admin users
    const targetCity = (req.user && req.user.role !== 'admin' && req.user.city)
      ? req.user.city.trim()
      : (city && city.trim() ? city.trim() : null);

    if (targetCity) {
      query += ` AND LOWER(d.city) = LOWER(?)`;
      params.push(targetCity);
    }

    if (food_type && food_type.trim()) {
      query += ` AND d.food_type = ?`;
      params.push(food_type.trim());
    }

    if (search && search.trim()) {
      query += ` AND (d.food_name LIKE ? OR d.pickup_location LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY d.expiry_datetime ASC`;

    const rawDonations = db.prepare(query).all(...params);

    // Attach urgency info and filter by urgency tag if requested
    let results = rawDonations.map(d => ({
      ...d,
      safety_checklist: d.safety_checklist ? JSON.parse(d.safety_checklist) : null,
      urgency: getUrgencyInfo(d.expiry_datetime)
    }));

    if (urgency && urgency.trim()) {
      results = results.filter(d => d.urgency.urgency === urgency.trim());
    }

    return res.json({
      count: results.length,
      cityZone: targetCity || 'All Zones',
      donations: results
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get all donations posted by the current donor
 */
function getMyDonations(req, res) {
  try {
    checkAndUpdateExpiredDonations();

    const donorId = req.user.id;
    const donations = db.prepare(`
      SELECT 
        d.*,
        da.id as assignment_id,
        da.ngo_id,
        da.volunteer_id,
        da.collection_type,
        da.beneficiaries_served,
        da.accepted_at,
        da.picked_up_at,
        da.delivered_at,
        da.delivery_notes,
        n.ngo_name,
        v_user.name as volunteer_name,
        v_user.phone as volunteer_phone
      FROM donations d
      LEFT JOIN donation_assignments da ON d.id = da.donation_id
      LEFT JOIN ngos n ON da.ngo_id = n.id
      LEFT JOIN volunteers v ON da.volunteer_id = v.id
      LEFT JOIN users v_user ON v.user_id = v_user.id
      WHERE d.donor_id = ?
      ORDER BY d.created_at DESC
    `).all(donorId);

    const enriched = donations.map(d => ({
      ...d,
      safety_checklist: d.safety_checklist ? JSON.parse(d.safety_checklist) : null,
      urgency: getUrgencyInfo(d.expiry_datetime)
    }));

    return res.json({ donations: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get single donation detail with full timeline & audit log
 */
function getDonationById(req, res) {
  try {
    const { id } = req.params;

    const donation = db.prepare(`
      SELECT 
        d.*,
        u.name as donor_name,
        u.phone as donor_phone,
        u.email as donor_email,
        da.id as assignment_id,
        da.collection_type,
        da.beneficiaries_served,
        da.accepted_at,
        da.picked_up_at,
        da.delivered_at,
        da.delivery_notes,
        n.ngo_name,
        n.address as ngo_address,
        n.city as ngo_city,
        v_user.name as volunteer_name,
        v_user.phone as volunteer_phone
      FROM donations d
      JOIN users u ON d.donor_id = u.id
      LEFT JOIN donation_assignments da ON d.id = da.donation_id
      LEFT JOIN ngos n ON da.ngo_id = n.id
      LEFT JOIN volunteers v ON da.volunteer_id = v.id
      LEFT JOIN users v_user ON v.user_id = v_user.id
      WHERE d.id = ?
    `).get(id);

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const logs = db.prepare(`
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.donation_id = ?
      ORDER BY l.timestamp ASC
    `).all(id);

    return res.json({
      donation: {
        ...donation,
        safety_checklist: donation.safety_checklist ? JSON.parse(donation.safety_checklist) : null,
        urgency: getUrgencyInfo(donation.expiry_datetime)
      },
      timeline: logs
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Donor cancels their posted donation (if not yet accepted)
 */
function cancelDonation(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.donor_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to cancel this donation' });
    }

    if (donation.status !== 'posted') {
      return res.status(400).json({ error: `Cannot cancel donation with status "${donation.status}". Only 'posted' donations can be cancelled.` });
    }

    db.prepare("UPDATE donations SET status = 'cancelled' WHERE id = ?").run(id);
    db.prepare(`
      INSERT INTO activity_logs (donation_id, user_id, action, details)
      VALUES (?, ?, 'DONATION_CANCELLED', 'Donation cancelled by donor')
    `).run(id, userId);

    return res.json({ message: 'Donation successfully cancelled' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createDonation,
  getAvailableDonations,
  getMyDonations,
  getDonationById,
  cancelDonation
};
