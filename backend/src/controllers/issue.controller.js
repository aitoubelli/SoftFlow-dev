const Issue = require('../models/Issue.model');
const Project = require('../models/Project.model');
const mongoose = require('mongoose');

const createIssue = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description } = req.body;

        // Validate projectId
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'ID de projet non valide.' });
        }

        // Check if project exists and user is the owner
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Accès refusé. Seuls les propriétaires peuvent créer des issues.' });
        }

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Le titre de l\'issue est requis.' });
        }

        // Create the issue
        const issue = new Issue({
            title: title.trim(),
            description: description || '',
            projectId: projectId
        });

        await issue.save();

        // Return the created issue without sensitive _id
        const issueResponse = {
            id: issue._id,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            projectId: issue.projectId,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt
        };

        return res.status(201).json(issueResponse);
    } catch (err) {
        console.error('Erreur création issue:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la création de l\'issue.' });
    }
};

module.exports = {
    createIssue,
};
