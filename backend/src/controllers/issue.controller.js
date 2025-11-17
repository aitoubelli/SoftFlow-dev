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

const getIssuesByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Validate projectId
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'ID de projet non valide.' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        // Get all issues for this project
        const issues = await Issue.find({ projectId }).sort({ createdAt: -1 });

        return res.status(200).json(issues);
    } catch (err) {
        console.error('Erreur récupération issues:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des issues.' });
    }
};

const updateIssue = async (req, res) => {
    try {
        const { projectId, issueId } = req.params;
        const { title, description, status } = req.body;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({ error: 'ID non valide.' });
        }

        // Check if project exists and user is the owner
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Accès refusé. Seuls les propriétaires peuvent modifier des issues.' });
        }

        // Find and update the issue
        const issue = await Issue.findOne({ _id: issueId, projectId });
        if (!issue) {
            return res.status(404).json({ error: 'Issue non trouvée.' });
        }

        if (title !== undefined) issue.title = title.trim();
        if (description !== undefined) issue.description = description;
        if (status !== undefined) issue.status = status;

        await issue.save();

        return res.status(200).json(issue);
    } catch (err) {
        console.error('Erreur mise à jour issue:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'issue.' });
    }
};

const deleteIssue = async (req, res) => {
    try {
        const { projectId, issueId } = req.params;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({ error: 'ID non valide.' });
        }

        // Check if project exists and user is the owner
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Accès refusé. Seuls les propriétaires peuvent supprimer des issues.' });
        }

        // Find and delete the issue
        const issue = await Issue.findOneAndDelete({ _id: issueId, projectId });
        if (!issue) {
            return res.status(404).json({ error: 'Issue non trouvée.' });
        }

        return res.status(200).json({ message: 'Issue supprimée avec succès.' });
    } catch (err) {
        console.error('Erreur suppression issue:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'issue.' });
    }
};

module.exports = {
    createIssue,
    getIssuesByProject,
    updateIssue,
    deleteIssue,
};
