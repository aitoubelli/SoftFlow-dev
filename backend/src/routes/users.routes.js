const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, adminOnly, adminOrOwnerOnly } = require('../middleware/auth.middleware'); // Import middleware

// Protect all user routes and ensure only admins can access/modify
router.get('/users', protect, adminOrOwnerOnly, authController.getAllUsers);
router.get('/users/counts', protect, adminOnly, authController.getUserCountsByRole); // New route for user counts
router.put('/users/:id/role', protect, adminOnly, authController.updateUserRole);

module.exports = router;
