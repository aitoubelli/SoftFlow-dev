const express = require('express');
const router = express.Router();
const { getDeveloperDashboardCounts, createTask, getTasksByProject, getTasksByIssue, updateTask, deleteTask } = require('../controllers/task.controller');
const { protect, developerOnly } = require('../middleware/auth.middleware');

// Get developer dashboard counts
router.get('/counts', protect, developerOnly, getDeveloperDashboardCounts);

// Create a new task for an issue
router.post('/projects/:projectId/tasks', protect, createTask);

// Get all tasks for a project
router.get('/projects/:projectId/tasks', protect, getTasksByProject);

// Get all tasks for a specific issue
router.get('/projects/:projectId/issues/:issueId/tasks', protect, getTasksByIssue);

// Update a task
router.put('/projects/:projectId/tasks/:taskId', protect, updateTask);

// Delete a task
router.delete('/projects/:projectId/tasks/:taskId', protect, deleteTask);

module.exports = router;
