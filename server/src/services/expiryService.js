const db = require('../config/database');

/**
 * Calculates urgency tag and remaining minutes for a given expiry date
 */
function getUrgencyInfo(expiryDateTimeStr) {
  const now = new Date();
  const expiry = new Date(expiryDateTimeStr);
  const diffMs = expiry - now;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes <= 0) {
    return {
      urgency: 'expired',
      diffMinutes: 0,
      diffHours: 0,
      badgeColor: 'gray',
      isUrgent: true,
      label: 'Expired'
    };
  } else if (diffMinutes <= 120) {
    // Under 2 hours -> Urgent
    return {
      urgency: 'urgent',
      diffMinutes,
      diffHours: (diffMinutes / 60).toFixed(1),
      badgeColor: 'red',
      isUrgent: true,
      label: 'Urgent (< 2 hrs)'
    };
  } else if (diffMinutes <= 240) {
    // 2 to 4 hours -> Expiring soon
    return {
      urgency: 'expiring_soon',
      diffMinutes,
      diffHours: (diffMinutes / 60).toFixed(1),
      badgeColor: 'amber',
      isUrgent: false,
      label: 'Expiring Soon'
    };
  } else {
    // Greater than 4 hours -> Fresh
    return {
      urgency: 'fresh',
      diffMinutes,
      diffHours: (diffMinutes / 60).toFixed(1),
      badgeColor: 'emerald',
      isUrgent: false,
      label: 'Fresh'
    };
  }
}

/**
 * Checks all active 'posted' donations and automatically marks them as 'expired'
 * if their expiry_datetime is in the past.
 */
function checkAndUpdateExpiredDonations() {
  try {
    const nowIso = new Date().toISOString();
    
    // Find donations that have expired
    const expiredDonations = db.prepare(`
      SELECT id, food_name, donor_id 
      FROM donations 
      WHERE status = 'posted' AND expiry_datetime <= ?
    `).all(nowIso);

    if (expiredDonations.length > 0) {
      const updateStmt = db.prepare(`UPDATE donations SET status = 'expired' WHERE id = ?`);
      const logStmt = db.prepare(`
        INSERT INTO activity_logs (donation_id, user_id, action, details)
        VALUES (?, NULL, 'AUTO_EXPIRED', ?)
      `);

      const autoExpireTx = db.transaction((donations) => {
        for (const item of donations) {
          updateStmt.run(item.id);
          logStmt.run(item.id, `Donation "${item.food_name}" automatically marked as expired because no NGO claimed it before the deadline.`);
        }
      });

      autoExpireTx(expiredDonations);
      console.log(`[ExpiryService] Automatically marked ${expiredDonations.length} donation(s) as expired.`);
    }

    return expiredDonations.length;
  } catch (err) {
    console.error('[ExpiryService] Error checking expired donations:', err.message);
    return 0;
  }
}

// Start periodic checker (every 60 seconds)
function startExpiryMonitor() {
  // Run once immediately
  checkAndUpdateExpiredDonations();
  
  const intervalId = setInterval(() => {
    checkAndUpdateExpiredDonations();
  }, 60 * 1000);

  return intervalId;
}

module.exports = {
  getUrgencyInfo,
  checkAndUpdateExpiredDonations,
  startExpiryMonitor
};
