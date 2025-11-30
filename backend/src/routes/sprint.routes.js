const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getSprintsByProject, createSprint } = require('../controllers/sprint.controller');

// Get all sprints for a project
router.get('/:projectId/sprints', protect, getSprintsByProject);

// Create a new sprint
router.post('/:projectId/sprints', protect, createSprint);

module.exports = router;
