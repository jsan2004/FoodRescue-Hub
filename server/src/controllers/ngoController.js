const db = require('../config/database');
const { getUrgencyInfo, checkAndUpdateExpiredDonations } = require('../services/expiryService');
const notificationService = require('../services/notificationService');

/**
 * Accept / Claim an available donation
 * Enforces city-zone isolation and triggers donor/volunteer notifications
 */
function acceptDonation(req, res) {
  try {
    const userId = req.user.id;
    const { donation_id, collection_type, volunteer_id, notes } = req.body;

    if (!donation_id || !collection_type) {
      return res.status(400).json({ error: 'donation_id and collection_type are required' });
    }

    if (!['volunteer', 'ngo_team'].includes(collection_type)) {
      return res.status(400).json({ error: 'collection_type must be "volunteer" or "ngo_team"' });
    }

    // Check NGO profile
    const ngo = db.prepare('SELECT * FROM ngos WHERE user_id = ?').get(userId);
    if (!ngo) {
      return res.status(403).json({ error: 'User does not have an NGO profile' });
    }

    if (ngo.verified !== 1 && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Your NGO account is currently pending administrator verification. You cannot claim food until approved.' 
      });
    }

    // Run expiry check
    checkAndUpdateExpiredDonations();

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donation_id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.status !== 'posted') {
      return res.status(400).json({ 
        error: `Donation is already in "${donation.status}" state and cannot be claimed.` 
      });
    }

    // Strict City Geo-Fencing: NGO can only claim donations in its registered city zone
    if (ngo.city && donation.city && ngo.city.toLowerCase() !== donation.city.toLowerCase() && req.user.role !== 'admin') {
      return res.status(400).json({
        error: `Cross-city claims are restricted. Your NGO is registered in ${ngo.city}, but this donation is in ${donation.city}.`
      });
    }

    let volunteer = null;
    let newStatus = 'accepted';

    if (collection_type === 'volunteer') {
      if (!volunteer_id) {
        return res.status(400).json({ error: 'volunteer_id is required when collection_type is "volunteer"' });
      }
      volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(volunteer_id);
      if (!volunteer) {
        return res.status(404).json({ error: 'Selected volunteer not found' });
      }
      newStatus = 'assigned';
    }

    const claimTx = db.transaction(() => {
      // Update donation status
      db.prepare('UPDATE donations SET status = ? WHERE id = ?').run(newStatus, donation_id);

      // Insert donation assignment with default ₹250 payout per delivery
      db.prepare(`
        INSERT INTO donation_assignments (
          donation_id, ngo_id, volunteer_id, collection_type, payout_amount, payout_status, accepted_at, delivery_notes
        ) VALUES (?, ?, ?, ?, 250.0, 'pending', CURRENT_TIMESTAMP, ?)
      `).run(donation_id, ngo.id, volunteer_id || null, collection_type, notes || null);

      // If volunteer assigned, update volunteer availability
      if (volunteer_id) {
        db.prepare("UPDATE volunteers SET availability_status = 'busy' WHERE id = ?").run(volunteer_id);
      }

      // Log activity
      const logDetails = collection_type === 'volunteer'
        ? `Claimed by NGO "${ngo.ngo_name}" and assigned to volunteer partner (₹250 payout allocated)`
        : `Claimed by NGO "${ngo.ngo_name}" for direct self-collection`;

      db.prepare(`
        INSERT INTO activity_logs (donation_id, user_id, action, details)
        VALUES (?, ?, 'DONATION_ACCEPTED', ?)
      `).run(donation_id, userId, logDetails);
    });

    claimTx();

    // Trigger in-app notifications and email dispatch to donor & volunteer
    notificationService.notifyDonationClaimed(donation, ngo, volunteer_id);

    return res.json({
      message: `Donation successfully claimed! Status updated to "${newStatus}".`,
      donation_id,
      status: newStatus
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get all donations claimed by this NGO
 */
function getNgoDonations(req, res) {
  try {
    const userId = req.user.id;
    const ngo = db.prepare('SELECT id FROM ngos WHERE user_id = ?').get(userId);
    if (!ngo) {
      return res.status(403).json({ error: 'NGO profile not found' });
    }

    const donations = db.prepare(`
      SELECT 
        d.*,
        da.id as assignment_id,
        da.collection_type,
        da.beneficiaries_served,
        da.payout_amount,
        da.payout_status,
        da.accepted_at,
        da.picked_up_at,
        da.delivered_at,
        da.delivery_notes,
        u.name as donor_name,
        u.phone as donor_phone,
        v_user.name as volunteer_name,
        v_user.phone as volunteer_phone
      FROM donation_assignments da
      JOIN donations d ON da.donation_id = d.id
      JOIN users u ON d.donor_id = u.id
      LEFT JOIN volunteers v ON da.volunteer_id = v.id
      LEFT JOIN users v_user ON v.user_id = v_user.id
      WHERE da.ngo_id = ?
      ORDER BY da.accepted_at DESC
    `).all(ngo.id);

    const enriched = donations.map(d => ({
      ...d,
      urgency: getUrgencyInfo(d.expiry_datetime)
    }));

    return res.json({ donations: enriched });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * NGO updates delivery status directly (e.g. for ngo_team collection)
 */
function updateDeliveryStatus(req, res) {
  try {
    const userId = req.user.id;
    const { donation_id, status, beneficiaries_served, notes } = req.body;

    if (!donation_id || !status) {
      return res.status(400).json({ error: 'donation_id and status are required' });
    }

    if (!['picked_up', 'delivered'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "picked_up" or "delivered"' });
    }

    const ngo = db.prepare('SELECT id, ngo_name FROM ngos WHERE user_id = ?').get(userId);
    if (!ngo) {
      return res.status(403).json({ error: 'NGO profile not found' });
    }

    const assignment = db.prepare(`
      SELECT * FROM donation_assignments WHERE donation_id = ? AND ngo_id = ?
    `).get(donation_id, ngo.id);

    if (!assignment) {
      return res.status(404).json({ error: 'Donation assignment not found for this NGO' });
    }

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donation_id);

    const updateTx = db.transaction(() => {
      db.prepare('UPDATE donations SET status = ? WHERE id = ?').run(status, donation_id);

      if (status === 'picked_up') {
        db.prepare(`
          UPDATE donation_assignments 
          SET picked_up_at = CURRENT_TIMESTAMP, delivery_notes = COALESCE(?, delivery_notes)
          WHERE id = ?
        `).run(notes || null, assignment.id);

        db.prepare(`
          INSERT INTO activity_logs (donation_id, user_id, action, details)
          VALUES (?, ?, 'FOOD_PICKED_UP', 'Food picked up by NGO team')
        `).run(donation_id, userId);
      } else if (status === 'delivered') {
        const beneficiaries = parseInt(beneficiaries_served, 10) || 0;
        db.prepare(`
          UPDATE donation_assignments 
          SET delivered_at = CURRENT_TIMESTAMP,
              beneficiaries_served = ?,
              payout_status = 'paid',
              delivery_notes = COALESCE(?, delivery_notes)
          WHERE id = ?
        `).run(beneficiaries, notes || null, assignment.id);

        // If a volunteer was assigned, credit their delivery count, hours & ₹250 earnings
        if (assignment.volunteer_id) {
          db.prepare(`
            UPDATE volunteers 
            SET total_deliveries = total_deliveries + 1,
                hours_contributed = hours_contributed + 1.5,
                total_earnings = total_earnings + 250.0,
                availability_status = 'available'
            WHERE id = ?
          `).run(assignment.volunteer_id);
        }

        db.prepare(`
          INSERT INTO activity_logs (donation_id, user_id, action, details)
          VALUES (?, ?, 'FOOD_DELIVERED', ?)
        `).run(donation_id, userId, `Food successfully distributed. Beneficiaries served: ${beneficiaries}`);
      }
    });

    updateTx();

    // Trigger notifications
    if (status === 'picked_up') {
      notificationService.notifyFoodPickedUp(donation, 'NGO Team');
    } else if (status === 'delivered') {
      const beneficiaries = parseInt(beneficiaries_served, 10) || 0;
      notificationService.notifyFoodDelivered(donation, null, beneficiaries, userId, null);
    }

    return res.json({
      message: `Donation status updated to "${status}"`,
      donation_id,
      status
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get available volunteers filtered strictly by NGO's city
 */
function getAvailableVolunteers(req, res) {
  try {
    const userCity = req.user?.city;
    let query = `
      SELECT v.id, v.availability_status, v.preferred_areas, v.total_deliveries, v.hours_contributed,
             v.total_earnings, v.upi_id, u.name, u.email, u.phone, u.city
      FROM volunteers v
      JOIN users u ON v.user_id = u.id
    `;
    const params = [];

    // Filter by city if NGO has a city
    if (userCity && req.user?.role !== 'admin') {
      query += ` WHERE LOWER(u.city) = LOWER(?)`;
      params.push(userCity);
    }

    query += ` ORDER BY v.availability_status ASC, v.total_deliveries DESC`;

    const volunteers = db.prepare(query).all(...params);

    return res.json({ 
      cityZone: userCity || 'All Zones',
      volunteers 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  acceptDonation,
  getNgoDonations,
  updateDeliveryStatus,
  getAvailableVolunteers
};
