const Issue = require('../models/Issue.model');
const Project = require('../models/Project.model');

// Get all issues for a project
const getIssuesByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        const issues = await Issue.find({ project: projectId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a new issue
const createIssue = async (req, res) => {
    try {
        const { title, description, projectId } = req.body;

        // Check if project exists
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        const issue = new Issue({
            title,
            description,
            project: projectId,
            createdBy: req.user._id,
            status: 'open'
        });

        await issue.save();
        await issue.populate('createdBy', 'name email');

        res.status(201).json(issue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update an issue (especially to close it)
const updateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, title, description } = req.body;

        const issue = await Issue.findById(id).populate('project');
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found.' });
        }

        // Check if user is the project owner
        if (issue.project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the project owner can modify issues.' });
        }

        // Update fields
        if (title) issue.title = title;
        if (description !== undefined) issue.description = description;
        if (status) {
            issue.status = status;
            issue.closedAt = status === 'closed' ? new Date() : null;
        }

        await issue.save();
        await issue.populate('createdBy', 'name email');

        res.json(issue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete an issue
const deleteIssue = async (req, res) => {
    try {
        const { id } = req.params;

        const issue = await Issue.findById(id).populate('project');
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found.' });
        }

        // Check if user is the project owner
        if (issue.project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the project owner can delete issues.' });
        }

        await Issue.findByIdAndDelete(id);
        res.json({ message: 'Issue deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    getIssuesByProject,
    createIssue,
    updateIssue,
    deleteIssue
    getIssuesByProject,
    updateIssue,
    deleteIssue,
};
