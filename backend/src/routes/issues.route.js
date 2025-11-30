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

/**
 * @swagger
 * /issues/project/{projectId}:
 *   get:
 *     summary: Get issues by project
 *     description: Retrieve all issues for a specific project
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Issues retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Issue'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/project/:projectId', getIssuesByProject);

/**
 * @swagger
 * /issues:
 *   post:
 *     summary: Create issue
 *     description: Create a new issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, status, priority, project]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Issue title
 *               description:
 *                 type: string
 *                 description: Issue description
 *               type:
 *                 type: string
 *                 enum: [bug, feature, enhancement, task]
 *                 description: Issue type
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, closed]
 *                 description: Issue status
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Issue priority
 *               project:
 *                 type: string
 *                 description: Project ID
 *               assignee:
 *                 type: string
 *                 description: Assignee user ID
 *               estimatedHours:
 *                 type: number
 *                 description: Estimated hours to complete
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createIssue);

/**
 * @swagger
 * /issues/{id}:
 *   patch:
 *     summary: Update issue
 *     description: Update an issue's details
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Issue title
 *               description:
 *                 type: string
 *                 description: Issue description
 *               type:
 *                 type: string
 *                 enum: [bug, feature, enhancement, task]
 *                 description: Issue type
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, closed]
 *                 description: Issue status
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: Issue priority
 *               assignee:
 *                 type: string
 *                 description: Assignee user ID
 *               estimatedHours:
 *                 type: number
 *                 description: Estimated hours to complete
 *     responses:
 *       200:
 *         description: Issue updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', updateIssue);

/**
 * @swagger
 * /issues/{id}:
 *   delete:
 *     summary: Delete issue
 *     description: Delete an issue
 *     tags: [Issues]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID
 *     responses:
 *       200:
 *         description: Issue deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Issue deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Issue not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteIssue);

module.exports = router;
