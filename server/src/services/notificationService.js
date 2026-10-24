const db = require('../config/database');

/**
 * Send a notification (creates in-app DB entry + simulates/logs email dispatch)
 */
function sendNotification({ userId, title, message, type = 'info' }) {
  try {
    if (!userId || !title || !message) return null;

    // Fetch user details for email logging
    const user = db.prepare('SELECT id, name, email, city FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    // Insert into in-app notifications
    const insertStmt = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, email_sent)
      VALUES (?, ?, ?, ?, 0, 1)
    `);
    const result = insertStmt.run(userId, title, message, type);
    const notificationId = result.lastInsertRowid;

    // Simulate & log email dispatch with timestamp
    const timestamp = new Date().toISOString();
    console.log(`[Notification & Email Service] ========================================`);
    console.log(`[Email Dispatch] Timestamp: ${timestamp}`);
    console.log(`[Email Dispatch] To: "${user.name}" <${user.email}> (User #${user.id}, City: ${user.city || 'N/A'})`);
    console.log(`[Email Dispatch] Subject: [FoodRescueHub] ${title}`);
    console.log(`[Email Dispatch] Message Body:`);
    console.log(`  Dear ${user.name},`);
    console.log(`  ${message}`);
    console.log(`  Access your portal: https://foodrescuehub.org.in`);
    console.log(`[Email Dispatch] Status: DELIVERED (Simulated SMTP Gateway 250 OK)`);
    console.log(`========================================================================`);

    return {
      id: notificationId,
      user_id: userId,
      title,
      message,
      type,
      is_read: 0,
      email_sent: 1
    };
  } catch (err) {
    console.error('[NotificationService] Failed to send notification:', err.message);
    return null;
  }
}

/**
 * Get all notifications for a specific user
 */
function getUserNotifications(userId) {
  try {
    return db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(userId);
  } catch (err) {
    console.error('[NotificationService] Failed to get notifications:', err.message);
    return [];
  }
}

/**
 * Mark a single notification as read
 */
function markAsRead(notificationId, userId) {
  try {
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ? AND user_id = ?
    `).run(notificationId, userId);
    return true;
  } catch (err) {
    console.error('[NotificationService] Failed to mark notification as read:', err.message);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
function markAllAsRead(userId) {
  try {
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ?
    `).run(userId);
    return true;
  } catch (err) {
    console.error('[NotificationService] Failed to mark all notifications as read:', err.message);
    return false;
  }
}

/**
 * Domain Event: New Donation Posted in City
 * Notifies all verified NGOs in that exact city zone
 */
function notifyNewDonationPosted(donation) {
  try {
    const city = donation.city || 'Bengaluru';
    const verifiedNgos = db.prepare(`
      SELECT n.user_id, n.ngo_name, u.email, u.name 
      FROM ngos n
      JOIN users u ON n.user_id = u.id
      WHERE LOWER(n.city) = LOWER(?) AND n.verified = 1
    `).all(city);

    verifiedNgos.forEach(ngo => {
      sendNotification({
        userId: ngo.user_id,
        title: `🚨 New Food Surplus in ${city}!`,
        message: `Fresh surplus available: "${donation.food_name}" (${donation.quantity} ${donation.quantity_unit}) posted at ${donation.pickup_location}. Open your Surplus Feed to claim.`,
        type: 'alert'
      });
    });
  } catch (err) {
    console.error('[NotificationService] Error notifying NGOs of new donation:', err.message);
  }
}

/**
 * Domain Event: Donation Claimed by NGO
 * Notifies donor, and volunteer (if assigned) with ₹250 stipend details
 */
function notifyDonationClaimed(donation, ngo, volunteerId) {
  try {
    // 1. Notify Donor
    sendNotification({
      userId: donation.donor_id,
      title: '✅ Donation Claimed by Verified NGO',
      message: `Great news! "${donation.food_name}" has been accepted and claimed by ${ngo.ngo_name}. Collection is now underway.`,
      type: 'success'
    });

    // 2. If Volunteer assigned, notify volunteer
    if (volunteerId) {
      const vol = db.prepare(`
        SELECT v.id, v.user_id, v.upi_id, u.name, u.email 
        FROM volunteers v
        JOIN users u ON v.user_id = u.id
        WHERE v.id = ?
      `).get(volunteerId);

      if (vol) {
        sendNotification({
          userId: vol.user_id,
          title: '🛵 New Delivery Mission Assigned (₹250 Stipend)',
          message: `You have been dispatched to pick up "${donation.food_name}" from ${donation.pickup_location} and deliver to ${ngo.ngo_name}. Turn-by-turn route is live in your dashboard. ₹250 payout credited upon completion.`,
          type: 'info'
        });
      }
    }
  } catch (err) {
    console.error('[NotificationService] Error notifying donation claimed:', err.message);
  }
}

/**
 * Domain Event: Food Picked Up by Volunteer
 */
function notifyFoodPickedUp(donation, volunteerName, ngoUserId) {
  try {
    // Notify Donor
    sendNotification({
      userId: donation.donor_id,
      title: '📦 Food Picked Up from Your Premises',
      message: `Volunteer ${volunteerName || 'Dispatch Partner'} has collected "${donation.food_name}" and is now en route to the shelter.`,
      type: 'info'
    });

    // Notify NGO
    if (ngoUserId) {
      sendNotification({
        userId: ngoUserId,
        title: '🚚 Delivery En Route',
        message: `Volunteer ${volunteerName || 'Dispatch Partner'} has picked up "${donation.food_name}" from the donor and is heading to your facility.`,
        type: 'info'
      });
    }
  } catch (err) {
    console.error('[NotificationService] Error notifying food picked up:', err.message);
  }
}

/**
 * Domain Event: Food Delivered & Completed
 * Notifies Donor, NGO, and Volunteer (with ₹250 UPI payout confirmation)
 */
function notifyFoodDelivered(donation, volunteerUserId, beneficiariesCount, ngoUserId, upiId) {
  try {
    // 1. Notify Donor
    sendNotification({
      userId: donation.donor_id,
      title: '🎉 Mission Accomplished: Food Successfully Delivered!',
      message: `Your donation of "${donation.food_name}" has been delivered safely and served ${beneficiariesCount || 0} individuals in need. Thank you for making a difference!`,
      type: 'success'
    });

    // 2. Notify NGO
    if (ngoUserId) {
      sendNotification({
        userId: ngoUserId,
        title: '🍽️ Food Distribution Confirmed',
        message: `Delivery of "${donation.food_name}" has been logged as complete. Total beneficiaries fed: ${beneficiariesCount || 0}.`,
        type: 'success'
      });
    }

    // 3. Notify Volunteer with UPI Payout Confirmation
    if (volunteerUserId) {
      sendNotification({
        userId: volunteerUserId,
        title: '💰 ₹250 Delivery Payout Credited via UPI!',
        message: `Mission complete for "${donation.food_name}"! ₹250 delivery stipend has been processed to your registered UPI ID (${upiId || 'volunteer@upi'}). Thank you for your service!`,
        type: 'success'
      });
    }
  } catch (err) {
    console.error('[NotificationService] Error notifying food delivered:', err.message);
  }
}

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  notifyNewDonationPosted,
  notifyDonationClaimed,
  notifyFoodPickedUp,
  notifyFoodDelivered
};
