const db = require('../config/database');
const { getUrgencyInfo } = require('../services/expiryService');
const notificationService = require('../services/notificationService');

/**
 * Get assigned tasks & earnings profile for current volunteer
 */
function getMyTasks(req, res) {
  try {
    const userId = req.user.id;
    const volunteer = db.prepare('SELECT * FROM volunteers WHERE user_id = ?').get(userId);

    if (!volunteer) {
      return res.status(403).json({ error: 'Volunteer profile not found' });
    }

    const tasks = db.prepare(`
      SELECT 
        d.id as donation_id,
        d.food_name,
        d.food_type,
        d.quantity,
        d.quantity_unit,
        d.preparation_datetime,
        d.expiry_datetime,
        d.pickup_location,
        d.city,
        d.status,
        d.notes as donor_notes,
        da.id as assignment_id,
        da.payout_amount,
        da.payout_status,
        da.beneficiaries_served,
        da.accepted_at,
        da.picked_up_at,
        da.delivered_at,
        da.delivery_notes,
        donor.name as donor_name,
        donor.phone as donor_phone,
        n.id as ngo_id,
        n.ngo_name,
        n.address as ngo_address,
        n.city as ngo_city
      FROM donation_assignments da
      JOIN donations d ON da.donation_id = d.id
      JOIN users donor ON d.donor_id = donor.id
      JOIN ngos n ON da.ngo_id = n.id
      WHERE da.volunteer_id = ?
      ORDER BY 
        CASE 
          WHEN d.status IN ('assigned', 'picked_up') THEN 1 
          ELSE 2 
        END,
        d.expiry_datetime ASC
    `).all(volunteer.id);

    const enriched = tasks.map(t => ({
      ...t,
      payout_amount: t.payout_amount || 250.0,
      payout_status: t.payout_status || (t.status === 'delivered' ? 'paid' : 'pending'),
      urgency: getUrgencyInfo(t.expiry_datetime)
    }));

    // Calculate total earnings from completed deliveries
    const totalDelivered = enriched.filter(t => t.status === 'delivered');
    const calculatedEarnings = totalDelivered.reduce((sum, t) => sum + (t.payout_amount || 250.0), 0);

    return res.json({
      profile: {
        ...volunteer,
        total_earnings: Math.max(volunteer.total_earnings || 0, calculatedEarnings),
        upi_id: volunteer.upi_id || 'volunteer@upi'
      },
      tasks: enriched
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Update volunteer task status ('picked_up' or 'delivered')
 * Credits ₹250 payout per completed delivery and dispatches notifications
 */
function updateTaskStatus(req, res) {
  try {
    const userId = req.user.id;
    const { donation_id, status, notes, beneficiaries_served } = req.body;

    if (!donation_id || !status) {
      return res.status(400).json({ error: 'donation_id and status are required' });
    }

    if (!['picked_up', 'delivered'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "picked_up" or "delivered"' });
    }

    const volunteer = db.prepare('SELECT * FROM volunteers WHERE user_id = ?').get(userId);
    if (!volunteer) {
      return res.status(403).json({ error: 'Volunteer profile not found' });
    }

    const assignment = db.prepare(`
      SELECT da.*, n.user_id as ngo_user_id 
      FROM donation_assignments da
      JOIN ngos n ON da.ngo_id = n.id
      WHERE da.donation_id = ? AND da.volunteer_id = ?
    `).get(donation_id, volunteer.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found for this volunteer' });
    }

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donation_id);
    const payoutAmount = assignment.payout_amount || 250.0;

    const taskTx = db.transaction(() => {
      db.prepare('UPDATE donations SET status = ? WHERE id = ?').run(status, donation_id);

      if (status === 'picked_up') {
        db.prepare(`
          UPDATE donation_assignments 
          SET picked_up_at = CURRENT_TIMESTAMP,
              delivery_notes = COALESCE(?, delivery_notes)
          WHERE id = ?
        `).run(notes || null, assignment.id);

        db.prepare(`
          INSERT INTO activity_logs (donation_id, user_id, action, details)
          VALUES (?, ?, 'FOOD_PICKED_UP', 'Volunteer picked up food from donor')
        `).run(donation_id, userId);
      } else if (status === 'delivered') {
        const beneficiaries = parseInt(beneficiaries_served, 10) || 0;
        db.prepare(`
          UPDATE donation_assignments 
          SET delivered_at = CURRENT_TIMESTAMP,
              beneficiaries_served = ?,
              payout_amount = ?,
              payout_status = 'paid',
              delivery_notes = COALESCE(?, delivery_notes)
          WHERE id = ?
        `).run(beneficiaries, payoutAmount, notes || null, assignment.id);

        // Update volunteer stats: +1 delivery, +1.5 hours, +payoutAmount (₹250), back to 'available'
        db.prepare(`
          UPDATE volunteers 
          SET total_deliveries = total_deliveries + 1,
              hours_contributed = hours_contributed + 1.5,
              total_earnings = total_earnings + ?,
              availability_status = 'available'
          WHERE id = ?
        `).run(payoutAmount, volunteer.id);

        db.prepare(`
          INSERT INTO activity_logs (donation_id, user_id, action, details)
          VALUES (?, ?, 'FOOD_DELIVERED', ?)
        `).run(donation_id, userId, `Volunteer delivered food. Beneficiaries served: ${beneficiaries}. Stipend of ₹${payoutAmount} credited.`);
      }
    });

    taskTx();

    // Trigger dual notification (in-app & simulated email)
    if (status === 'picked_up') {
      notificationService.notifyFoodPickedUp(donation, req.user.name, assignment.ngo_user_id);
    } else if (status === 'delivered') {
      const beneficiaries = parseInt(beneficiaries_served, 10) || 0;
      notificationService.notifyFoodDelivered(
        donation, 
        userId, 
        beneficiaries, 
        assignment.ngo_user_id, 
        volunteer.upi_id || 'volunteer@upi'
      );
    }

    return res.json({
      message: status === 'delivered' 
        ? `Delivery confirmed! ₹${payoutAmount} payout credited to your UPI ID (${volunteer.upi_id || 'volunteer@upi'}).`
        : `Task successfully updated to "${status}". Food is now in transit.`,
      donation_id,
      status,
      payout_amount: status === 'delivered' ? payoutAmount : undefined,
      payout_status: status === 'delivered' ? 'paid' : undefined
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Update volunteer availability status
 */
function updateAvailability(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.body;

    if (!status || !['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "available", "busy", or "offline"' });
    }

    const volunteer = db.prepare('SELECT id FROM volunteers WHERE user_id = ?').get(userId);
    if (!volunteer) {
      return res.status(403).json({ error: 'Volunteer profile not found' });
    }

    db.prepare('UPDATE volunteers SET availability_status = ? WHERE id = ?').run(status, volunteer.id);

    return res.json({
      message: `Availability updated to "${status}"`,
      status
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Update volunteer profile (UPI ID for payouts & preferred areas)
 */
function updateVolunteerProfile(req, res) {
  try {
    const userId = req.user.id;
    const { upi_id, preferred_areas } = req.body;

    const volunteer = db.prepare('SELECT id FROM volunteers WHERE user_id = ?').get(userId);
    if (!volunteer) {
      return res.status(403).json({ error: 'Volunteer profile not found' });
    }

    if (upi_id) {
      db.prepare('UPDATE volunteers SET upi_id = ? WHERE id = ?').run(upi_id.trim(), volunteer.id);
    }
    if (preferred_areas) {
      db.prepare('UPDATE volunteers SET preferred_areas = ? WHERE id = ?').run(preferred_areas.trim(), volunteer.id);
    }

    const updated = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(volunteer.id);

    return res.json({
      message: 'Volunteer payout & area settings updated successfully',
      profile: updated
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMyTasks,
  updateTaskStatus,
  updateAvailability,
  updateVolunteerProfile
};
