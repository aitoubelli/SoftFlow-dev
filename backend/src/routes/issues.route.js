const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    getIssuesByProject,
    createIssue,
    updateIssue,
    deleteIssue
} = require('../controllers/issue.controller');

// All routes require authentication
router.use(protect);

// GET /api/issues/project/:projectId - Get all issues for a project
router.get('/project/:projectId', getIssuesByProject);

// POST /api/issues - Create a new issue
router.post('/', createIssue);

// PATCH /api/issues/:id - Update an issue (close, modify, etc.)
router.patch('/:id', updateIssue);

// DELETE /api/issues/:id - Delete an issue
router.delete('/:id', deleteIssue);

module.exports = router;
