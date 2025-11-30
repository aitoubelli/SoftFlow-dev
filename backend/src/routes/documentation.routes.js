const express = require('express');
const router = express.Router();
const documentationController = require('../controllers/documentation.controller');
const { protect, adminOrOwnerOnly } = require('../middleware/auth.middleware'); // Corrected import path

/**
 * @swagger
 * /documentation:
 *   post:
 *     summary: Create documentation
 *     description: Create a new documentation entry (admin/owner only)
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, type, projectId]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [admin, user]
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Documentation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Documentation'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', protect, adminOrOwnerOnly, documentationController.createDocumentation);

/**
 * @swagger
 * /documentation/project/{projectId}:
 *   get:
 *     summary: Get project documentation
 *     description: Retrieve all documentation for a specific project
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of documentation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Documentation'
 *       401:
 *         description: Unauthorized
 */
router.get('/project/:projectId', protect, documentationController.getDocumentationByProject);

/**
 * @swagger
 * /documentation/{id}:
 *   put:
 *     summary: Update documentation
 *     description: Update an existing documentation entry (admin/owner only)
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documentation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Documentation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Documentation not found
 */
router.put('/:id', protect, adminOrOwnerOnly, documentationController.updateDocumentation);

module.exports = router;
