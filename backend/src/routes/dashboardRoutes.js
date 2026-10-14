const express = require('express');
const { getStats, getRecentActivity } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('admin', 'super_admin'), getStats);
router.get('/recent', protect, authorize('admin', 'super_admin'), getRecentActivity);

module.exports = router;
