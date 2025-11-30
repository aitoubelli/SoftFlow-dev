const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project.model');
const projectController = require('../controllers/project.controller'); // Import project controller
const issueController = require('../controllers/issue.controller'); // Import issue controller

const { protect, adminOrOwnerOnly } = require('../middleware/auth.middleware');

/**
 * @swagger
 * /projects/counts:
 *   get:
 *     summary: Get project counts
 *     description: Get counts of projects by status or other metrics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   description: Total number of projects
 *                 active:
 *                   type: number
 *                   description: Number of active projects
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/counts', protect, projectController.getProjectCounts);

// Get all projects by owner/member
/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve all projects the user has access to (owner/member)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, async (req, res) => {
    try {
        let query = {};

        // if user is not admin, filter projects where user is owner or member
        if (req.user.role !== 'admin') {
            query = {
                $or: [
                    { owner: req.user._id },
                    { 'members.user': req.user._id }
                ]
            };
        }

        const projects = await Project.find(query).populate('owner');

        return res.status(200).json(projects);
    } catch (err) {
        console.error('Erreur lister projets:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des projets.' });
    }
});


// Create a new project
/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project (admin/owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *               owner:
 *                 type: string
 *                 description: Owner user ID (optional, defaults to current user)
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
router.post('/', protect, adminOrOwnerOnly, async (req, res) => {
    try {
        const { name, description, owner } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Le nom du projet est requis.' });
        }

        // validate owner if provided: must be a valid ObjectId
        let ownerId = req.user._id; // default to current user
        if (owner) {
            if (mongoose.Types.ObjectId.isValid(owner)) {
                ownerId = owner
            } else {
                // ignore invalid owner instead of throwing a CastError
                console.warn('Owner fourni non valide, ignoré:', owner)
            }
        }

        const project = new Project({
            name: name.trim(),
            description: description || '',
            owner: ownerId
        });

        await project.save();

        return res.status(201).json(project);
    } catch (err) {
        console.error('Erreur création projet:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la création du projet.' });
    }
});

// Get a project by ID
/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve a specific project by its ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid project ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de projet non valide.' });
        }

        const project = await Project.findById(id).populate('owner').populate('members.user');

        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        return res.status(200).json(project);
    } catch (err) {
        console.error('Erreur récupération projet:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération du projet.' });
    }
});

// Assign users to a project
/**
 * @swagger
 * /projects/{id}/assign:
 *   post:
 *     summary: Assign users to project
 *     description: Assign multiple users to a project (admin/owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
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
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to assign
 *     responses:
 *       200:
 *         description: Users assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/assign', protect, adminOrOwnerOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de projet non valide.' });
        }

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'La liste des utilisateurs est requise.' });
        }

        if (!userIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
            return res.status(400).json({ error: 'Un ou plusieurs IDs utilisateur non valides.' });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        // Filter out users that are already members
        const newMemberIds = userIds.filter(userId =>
            !project.members.some(member => member.user.toString() === userId)
        );

        if (newMemberIds.length === 0) {
            return res.status(400).json({ error: 'Tous les utilisateurs sélectionnés sont déjà membres du projet.' });
        }

        const newMembers = newMemberIds.map(userId => ({
            user: userId,
            role: 'dev' // default role
        }));

        project.members.push(...newMembers);
        await project.save();

        const updatedProject = await Project.findById(id).populate('owner').populate('members.user');
        return res.status(200).json(updatedProject);
    } catch (err) {
        console.error('Erreur assignation utilisateur au projet:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de l\'assignation.' });
    }
});

// Create an issue for a project
router.post('/:projectId/issues', protect, issueController.createIssue);

// Get all issues for a project
router.get('/:projectId/issues', protect, issueController.getIssuesByProject);

// Update an issue
router.put('/:projectId/issues/:issueId', protect, issueController.updateIssue);

// Delete an issue
router.delete('/:projectId/issues/:issueId', protect, issueController.deleteIssue);

// Unassign a user from a project
/**
 * @swagger
 * /projects/{id}/unassign:
 *   post:
 *     summary: Unassign user from project
 *     description: Remove a user from a project (admin/owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
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
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to unassign
 *     responses:
 *       200:
 *         description: User unassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
 *       404:
 *         description: Project or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/unassign', protect, adminOrOwnerOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de projet non valide.' });
        }

        if (!userId) {
            return res.status(400).json({ error: 'ID utilisateur requis.' });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        // Find and remove the member
        const initialLength = project.members.length;
        project.members = project.members.filter(member => member.user.toString() !== userId);

        if (project.members.length === initialLength) {
            return res.status(404).json({ error: 'Utilisateur non trouvé dans ce projet.' });
        }

        await project.save();

        const updatedProject = await Project.findById(id).populate('owner').populate('members.user');
        return res.status(200).json(updatedProject);
    } catch (err) {
        console.error('Erreur désassignation utilisateur du projet:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la désassignation.' });
    }
});

module.exports = router;
