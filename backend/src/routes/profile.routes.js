// backend/src/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getProfile, updateProfile } = require('../controllers/profile.controller');

// All profile routes require authentication
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
