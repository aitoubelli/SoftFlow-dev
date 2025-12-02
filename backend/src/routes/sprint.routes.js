const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getSprintsByProject, createSprint } = require('../controllers/sprint.controller');

/**
 * @swagger
 * /projects/{projectId}/sprints:
 *   get:
 *     summary: Get sprints by project
 *     description: Get all sprints for a specific project
 *     tags: [Sprints]
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
 *         description: Sprints retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sprint'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:projectId/sprints', protect, getSprintsByProject);

/**
 * @swagger
 * /projects/{projectId}/sprints:
 *   post:
 *     summary: Create a sprint
 *     description: Create a new sprint for a project
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Sprint name
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Sprint start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Sprint end date
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of task IDs to assign to the sprint
 *     responses:
 *       201:
 *         description: Sprint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sprint'
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
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:projectId/sprints', protect, createSprint);

module.exports = router;
