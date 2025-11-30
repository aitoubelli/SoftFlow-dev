const Sprint = require('../models/Sprint.model');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const mongoose = require('mongoose');

exports.createSprint = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, startDate, endDate, taskIds } = req.body;

        console.log('Creating sprint for project:', projectId);
        console.log('User:', req.user);

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'ID de projet non valide.' });
        }

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ error: 'Nom, date de début et date de fin requis.' });
        }

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ error: 'La date de fin doit être après la date de début.' });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Le nom du sprint est requis.' });
        }


        const project = await Project.findById(projectId);
        if (!project) {
            console.log('Project not found');
            return res.status(404).json({ error: 'Sprint Controller: Projet non trouvé (DB lookup failed).' });
        }

        // Check permissions (Admin or Owner)
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        console.log('Permissions check - Is Owner:', isOwner, 'Is Admin:', isAdmin);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Non autorisé à créer un sprint pour ce projet.' });
        }

        const sprint = await Sprint.create({
            name,
            project: projectId,
            startDate,
            endDate,
            tasks: taskIds || []
        });

        console.log('Sprint created:', sprint._id);

        return res.status(201).json(sprint);
    } catch (err) {
        console.error('Erreur création sprint:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la création du sprint.' });
    }
};

exports.getSprintsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'ID de projet non valide.' });
        }

        const sprints = await Sprint.find({ project: projectId })
            .sort({ createdAt: -1 })
            .populate('tasks');

        return res.status(200).json(sprints);
    } catch (err) {
        console.error('Erreur récupération sprints:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des sprints.' });
    }
};