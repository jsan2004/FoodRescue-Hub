const express = require('express');
const router = express.Router();

const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const authController = require('../controllers/authController');
const donationController = require('../controllers/donationController');
const ngoController = require('../controllers/ngoController');
const volunteerController = require('../controllers/volunteerController');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');
const evaluationController = require('../controllers/evaluationController');
const upload = require('../middleware/uploadMiddleware');

// --- File Upload Route ---
router.post('/upload', authenticateToken, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl,
      filename: req.file.filename
    });
  });
});

// --- Public & Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);
router.put('/auth/profile', authenticateToken, authController.updateProfile);
router.get('/auth/demo-accounts', authController.getDemoAccounts);

// Public Community Impact Stats
router.get('/impact-stats', adminController.getPublicImpactStats);

// --- Notification Routes (In-App & Email Dispatches) ---
router.get('/notifications', authenticateToken, notificationController.getMyNotifications);
router.post('/notifications/:id/read', authenticateToken, notificationController.markRead);
router.post('/notifications/read-all', authenticateToken, notificationController.markAllRead);

// --- Donation Routes ---
// Public/NGO browse available food (uses optional auth for strict city zone matching)
router.get('/donations/available', optionalAuthenticateToken, donationController.getAvailableDonations);
router.get('/donations/:id', donationController.getDonationById);

// Donor actions
router.post('/donations', authenticateToken, requireRole('donor', 'admin'), donationController.createDonation);
router.get('/donations/donor/my', authenticateToken, requireRole('donor', 'admin'), donationController.getMyDonations);
router.post('/donations/:id/cancel', authenticateToken, donationController.cancelDonation);

// --- NGO Routes ---
router.post('/ngo/accept', authenticateToken, requireRole('ngo', 'admin'), ngoController.acceptDonation);
router.get('/ngo/my-donations', authenticateToken, requireRole('ngo', 'admin'), ngoController.getNgoDonations);
router.post('/ngo/update-status', authenticateToken, requireRole('ngo', 'admin'), ngoController.updateDeliveryStatus);
router.get('/ngo/volunteers', authenticateToken, requireRole('ngo', 'admin'), ngoController.getAvailableVolunteers);

// --- Volunteer Routes ---
router.get('/volunteer/tasks', authenticateToken, requireRole('volunteer', 'admin'), volunteerController.getMyTasks);
router.post('/volunteer/update-status', authenticateToken, requireRole('volunteer', 'admin'), volunteerController.updateTaskStatus);
router.post('/volunteer/availability', authenticateToken, requireRole('volunteer', 'admin'), volunteerController.updateAvailability);
router.put('/volunteer/profile', authenticateToken, requireRole('volunteer', 'admin'), volunteerController.updateVolunteerProfile);

// --- Administrator Routes ---
router.get('/admin/donations', authenticateToken, requireRole('admin'), adminController.getAllDonations);
router.get('/admin/ngos', authenticateToken, requireRole('admin'), adminController.getNgoVerifications);
router.post('/admin/ngos/verify', authenticateToken, requireRole('admin'), adminController.verifyNgo);
router.get('/admin/users', authenticateToken, requireRole('admin'), adminController.getUsers);
router.get('/admin/analytics', authenticateToken, requireRole('admin'), adminController.getAnalytics);

// --- Research / Evaluation Benchmarking Routes (Section 10 of proposal) ---
router.post('/evaluation/record', evaluationController.recordEvaluation);
router.get('/evaluation/metrics', evaluationController.getEvaluationMetrics);

module.exports = router;
