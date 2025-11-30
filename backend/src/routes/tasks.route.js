const express = require('express');
const router = express.Router();
const { getDeveloperDashboardCounts, createTask, getTasksByProject, getTasksByIssue, updateTask, deleteTask } = require('../controllers/task.controller');
const { protect, developerOnly } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /tasks/counts:
 *   get:
 *     summary: Get developer dashboard counts
 *     description: Get task-related counts for developer dashboard (developer only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTasks:
 *                   type: number
 *                   description: Total number of tasks
 *                 completedTasks:
 *                   type: number
 *                   description: Number of completed tasks
 *                 pendingTasks:
 *                   type: number
 *                   description: Number of pending tasks
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
router.get('/counts', protect, developerOnly, getDeveloperDashboardCounts);

/**
 * @swagger
 * /tasks/projects/{projectId}/tasks:
 *   post:
 *     summary: Create task for project
 *     description: Create a new task for an issue in a project
 *     tags: [Tasks]
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
 *             required: [title, issueId]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done]
 *                 description: Task status
 *                 default: todo
 *               assignee:
 *                 type: string
 *                 description: Assignee user ID
 *               issueId:
 *                 type: string
 *                 description: Issue ID this task belongs to
 *               estimatedHours:
 *                 type: number
 *                 description: Estimated hours to complete
 *               actualHours:
 *                 type: number
 *                 description: Actual hours spent
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
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
router.post('/projects/:projectId/tasks', protect, createTask);

/**
 * @swagger
 * /tasks/projects/{projectId}/tasks:
 *   get:
 *     summary: Get tasks by project
 *     description: Retrieve all tasks for a specific project
 *     tags: [Tasks]
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
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/projects/:projectId/tasks', protect, getTasksByProject);

/**
 * @swagger
 * /tasks/projects/{projectId}/issues/{issueId}/tasks:
 *   get:
 *     summary: Get tasks by issue
 *     description: Retrieve all tasks for a specific issue
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - name: issueId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/projects/:projectId/issues/:issueId/tasks', protect, getTasksByIssue);

/**
 * @swagger
 * /tasks/projects/{projectId}/tasks/{taskId}:
 *   put:
 *     summary: Update task
 *     description: Update a task's details
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done]
 *                 description: Task status
 *               assignee:
 *                 type: string
 *                 description: Assignee user ID
 *               estimatedHours:
 *                 type: number
 *                 description: Estimated hours to complete
 *               actualHours:
 *                 type: number
 *                 description: Actual hours spent
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
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
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/projects/:projectId/tasks/:taskId', protect, updateTask);

/**
 * @swagger
 * /tasks/projects/{projectId}/tasks/{taskId}:
 *   delete:
 *     summary: Delete task
 *     description: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/projects/:projectId/tasks/:taskId', protect, deleteTask);

module.exports = router;
