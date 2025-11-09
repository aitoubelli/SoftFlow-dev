const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../models/Project.model');
const projectController = require('../controllers/project.controller'); // Import project controller

const { protect, adminOrOwnerOnly } = require('../middleware/auth.middleware');

// Get project counts
router.get('/counts', protect, projectController.getProjectCounts);

// Get all projects by owner/member
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
router.post('/', protect, adminOrOwnerOnly, async (req, res) => {
    try {
        const { name, description, owner } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Le nom du projet est requis.' });
        }

        // validate owner if provided: must be a valid ObjectId
        let ownerId = undefined
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

module.exports = router;
