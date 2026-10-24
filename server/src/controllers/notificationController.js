const notificationService = require('../services/notificationService');

/**
 * Get authenticated user's notifications
 */
function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = notificationService.getUserNotifications(userId);
    const unreadCount = notifications.filter(n => n.is_read === 0).length;

    return res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Mark a single notification as read
 */
function markRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    notificationService.markAsRead(id, userId);
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Mark all notifications as read
 */
function markAllRead(req, res) {
  try {
    const userId = req.user.id;
    notificationService.markAllAsRead(userId);
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead
};
