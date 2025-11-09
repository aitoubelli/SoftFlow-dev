const express = require('express');
const router = express.Router();
const { getDeveloperDashboardCounts } = require('../controllers/task.controller');
const { protect, developerOnly } = require('../middleware/auth.middleware');

// Get developer dashboard counts
router.get('/counts', protect, developerOnly, getDeveloperDashboardCounts);

module.exports = router;
