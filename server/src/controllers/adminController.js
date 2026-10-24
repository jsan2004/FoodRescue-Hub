const db = require('../config/database');
const { getUrgencyInfo, checkAndUpdateExpiredDonations } = require('../services/expiryService');

/**
 * Get all donations across the system with filtering
 */
function getAllDonations(req, res) {
  try {
    checkAndUpdateExpiredDonations();

    const { status, city, food_type } = req.query;
    let query = `
      SELECT 
        d.*,
        u.name as donor_name,
        u.email as donor_email,
        u.phone as donor_phone,
        da.id as assignment_id,
        da.collection_type,
        da.beneficiaries_served,
        da.accepted_at,
        da.picked_up_at,
        da.delivered_at,
        n.ngo_name,
        v_user.name as volunteer_name
      FROM donations d
      JOIN users u ON d.donor_id = u.id
      LEFT JOIN donation_assignments da ON d.id = da.donation_id
      LEFT JOIN ngos n ON da.ngo_id = n.id
      LEFT JOIN volunteers v ON da.volunteer_id = v.id
      LEFT JOIN users v_user ON v.user_id = v_user.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status.trim()) {
      query += ` AND d.status = ?`;
      params.push(status.trim());
    }

    if (city && city.trim()) {
      query += ` AND LOWER(d.city) = LOWER(?)`;
      params.push(city.trim());
    }

    if (food_type && food_type.trim()) {
      query += ` AND d.food_type = ?`;
      params.push(food_type.trim());
    }

    query += ` ORDER BY d.created_at DESC`;

    const donations = db.prepare(query).all(...params);

    const enriched = donations.map(d => ({
      ...d,
      safety_checklist: d.safety_checklist ? JSON.parse(d.safety_checklist) : null,
      urgency: getUrgencyInfo(d.expiry_datetime)
    }));

    return res.json({
      count: enriched.length,
      donations: enriched
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get list of NGOs with verification status
 */
function getNgoVerifications(req, res) {
  try {
    const ngos = db.prepare(`
      SELECT 
        n.*,
        u.name as contact_person,
        u.email,
        u.phone
      FROM ngos n
      JOIN users u ON n.user_id = u.id
      ORDER BY 
        CASE WHEN n.verified = 0 THEN 1 ELSE 2 END,
        n.created_at DESC
    `).all();

    return res.json({ ngos });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Approve (1) or Reject (-1) NGO registration
 */
function verifyNgo(req, res) {
  try {
    const { ngo_id, status } = req.body; // status: 1 for approved, -1 for rejected

    if (!ngo_id || (status !== 1 && status !== -1)) {
      return res.status(400).json({ error: 'ngo_id and status (1 or -1) are required' });
    }

    const ngo = db.prepare('SELECT * FROM ngos WHERE id = ?').get(ngo_id);
    if (!ngo) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    db.prepare('UPDATE ngos SET verified = ? WHERE id = ?').run(status, ngo_id);

    const actionText = status === 1 ? 'Approved' : 'Rejected';
    db.prepare(`
      INSERT INTO activity_logs (donation_id, user_id, action, details)
      VALUES (NULL, ?, 'NGO_VERIFICATION', ?)
    `).run(req.user.id, `NGO "${ngo.ngo_name}" was ${actionText} by Administrator`);

    return res.json({
      message: `NGO "${ngo.ngo_name}" has been ${actionText.toLowerCase()}.`,
      ngo_id,
      verified: status
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get all users for admin management
 */
function getUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, phone, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * High-level system analytics & reports
 */
function getAnalytics(req, res) {
  try {
    checkAndUpdateExpiredDonations();

    // Summary counts
    const totalDonations = db.prepare('SELECT COUNT(*) as count FROM donations').get().count;
    const deliveredCount = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status = 'delivered'").get().count;
    const expiredCount = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status = 'expired'").get().count;
    const activeCount = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status IN ('posted', 'accepted', 'assigned', 'picked_up')").get().count;
    const cancelledCount = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status = 'cancelled'").get().count;

    // Total beneficiaries served
    const beneficiariesTotal = db.prepare(`
      SELECT SUM(beneficiaries_served) as total 
      FROM donation_assignments 
      WHERE beneficiaries_served IS NOT NULL
    `).get().total || 0;

    // Estimated total quantity delivered (servings + kg)
    const quantityDelivered = db.prepare(`
      SELECT SUM(quantity) as total 
      FROM donations 
      WHERE status = 'delivered'
    `).get().total || 0;

    // Total users count by role
    const usersByRole = db.prepare(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `).all();

    // Breakdown by food type
    const foodTypeBreakdown = db.prepare(`
      SELECT food_type, COUNT(*) as count, SUM(quantity) as total_quantity
      FROM donations
      GROUP BY food_type
      ORDER BY count DESC
    `).all();

    // Distribution by NGO
    const ngoStats = db.prepare(`
      SELECT 
        n.ngo_name,
        n.city,
        COUNT(da.id) as total_claimed,
        SUM(CASE WHEN d.status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
        SUM(da.beneficiaries_served) as total_beneficiaries
      FROM ngos n
      LEFT JOIN donation_assignments da ON n.id = da.ngo_id
      LEFT JOIN donations d ON da.donation_id = d.id
      WHERE n.verified = 1
      GROUP BY n.id
      ORDER BY delivered_count DESC
    `).all();

    // Recent activity log
    const recentActivity = db.prepare(`
      SELECT l.*, u.name as user_name, u.role as user_role, d.food_name
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN donations d ON l.donation_id = d.id
      ORDER BY l.timestamp DESC
      LIMIT 10
    `).all();

    // Calculate waste prevention rate: delivered / (delivered + expired)
    const nonPendingTotal = deliveredCount + expiredCount;
    const wasteDiversionRate = nonPendingTotal > 0 
      ? Math.round((deliveredCount / nonPendingTotal) * 100) 
      : 100;

    return res.json({
      summary: {
        totalDonations,
        deliveredCount,
        expiredCount,
        activeCount,
        cancelledCount,
        beneficiariesTotal,
        quantityDelivered,
        wasteDiversionRate
      },
      usersByRole,
      foodTypeBreakdown,
      ngoStats,
      recentActivity
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Public statistics for community landing page
 */
function getPublicImpactStats(req, res) {
  try {
    checkAndUpdateExpiredDonations();

    const deliveredDonations = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status = 'delivered'").get().count;
    const beneficiariesFed = db.prepare("SELECT SUM(beneficiaries_served) as total FROM donation_assignments").get().total || 0;
    const totalDonations = db.prepare("SELECT COUNT(*) as count FROM donations").get().count;
    const activePartners = db.prepare("SELECT COUNT(*) as count FROM ngos WHERE verified = 1").get().count;
    const totalKgSaved = db.prepare("SELECT SUM(quantity) as total FROM donations WHERE status = 'delivered'").get().total || 0;

    const partnerNgos = db.prepare(`
      SELECT ngo_name, city FROM ngos WHERE verified = 1 ORDER BY created_at DESC LIMIT 6
    `).all();

    return res.json({
      deliveredDonations,
      beneficiariesFed,
      totalDonations,
      activePartners,
      totalKgSaved,
      partnerNgos
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllDonations,
  getNgoVerifications,
  verifyNgo,
  getUsers,
  getAnalytics,
  getPublicImpactStats
};
