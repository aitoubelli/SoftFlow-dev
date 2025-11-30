const express = require('express');
const router = express.Router();
const testcaseController = require('../controllers/testcase.controller');
const { protect, adminOrOwnerOnly } = require('../middleware/auth.middleware');

// Create test case
router.post('/projects/:projectId/testcases', protect, adminOrOwnerOnly, testcaseController.createTestCase);

// Get all test cases for a project
router.get('/projects/:projectId/testcases', protect, testcaseController.getTestCasesByProject);

// Get test cases for a specific task
router.get('/projects/:projectId/tasks/:taskId/testcases', protect, testcaseController.getTestCasesByTask);

// Update test case
router.put('/projects/:projectId/testcases/:testCaseId', protect, adminOrOwnerOnly, testcaseController.updateTestCase);

// Delete test case
router.delete('/projects/:projectId/testcases/:testCaseId', protect, adminOrOwnerOnly, testcaseController.deleteTestCase);

module.exports = router;
