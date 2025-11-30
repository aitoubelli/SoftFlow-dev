const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const mongoose = require('mongoose');

const getDeveloperDashboardCounts = async (req, res) => {
    try {
        const developerId = req.user._id;

        // Projects assigned to the developer (either as owner or member)
        const assignedProjects = await Project.find({
            $or: [
                { owner: developerId },
                { 'members.user': developerId }
            ]
        });

        const assignedProjectIds = assignedProjects.map(project => project._id);

        // Tasks in progress for the developer across their assigned projects
        const inProgressTasks = await Task.countDocuments({
            assignee: developerId,
            project: { $in: assignedProjectIds },
            status: 'in_progress'
        });

        // Completed tasks for the developer across their assigned projects
        const completedTasks = await Task.countDocuments({
            assignee: developerId,
            project: { $in: assignedProjectIds },
            status: 'done'
        });

        // Reported bugs - assuming 'bug' is a task type or a specific status.
        // For now, let's assume tasks with 'todo' status and a title/description indicating a bug.
        // A more robust solution would involve a 'type' field in the Task model.
        const reportedBugs = await Task.countDocuments({
            assignee: developerId,
            project: { $in: assignedProjectIds },
            status: 'todo', // Or a specific 'bug' status if added
            // Potentially add a regex search on title/description for 'bug' keywords if no type field
        });


        res.json({
            assignedProjectsCount: assignedProjectIds.length,
            inProgressTasksCount: inProgressTasks,
            reportedBugsCount: reportedBugs,
            completedTasksCount: completedTasks,
        });

    } catch (err) {
        console.error('Erreur récupération des comptes du tableau de bord développeur:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des comptes du tableau de bord développeur.' });
    }
};

const createTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { issueId, title, description } = req.body;

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Le titre de la tâche est requis.' });
        }

        if (!issueId) {
            return res.status(400).json({ error: 'L\'ID de l\'issue est requis.' });
        }

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({ error: 'ID non valide.' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        // Check if user is the project owner or admin
        if (req.user.role !== 'admin' && project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Accès refusé. Seuls les propriétaires peuvent créer des tâches.' });
        }

        // Check if issue exists and belongs to the project
        const issue = await Issue.findOne({ _id: issueId, project: projectId });
        if (!issue) {
            return res.status(404).json({ error: 'Issue non trouvée ou n\'appartient pas au projet.' });
        }

        // Check if issue is closed
        if (issue.status === 'closed') {
            return res.status(400).json({ error: 'Impossible de créer une tâche pour une issue fermée.' });
        }

        // Create the task
        const task = new Task({
            title: title.trim(),
            description: description || '',
            project: projectId,
            issueId: issueId,
            status: 'todo'
        });

        await task.save();

        // Return the created task
        return res.status(201).json(task);
    } catch (err) {
        console.error('Erreur création tâche:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la création de la tâche.' });
    }
};

const getTasksByProject = async (req, res) => {
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

        // Check permissions
        const isAdmin = req.user.role === 'admin';
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isMember = project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!isAdmin && !isOwner && !isMember) {
            return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas membre de ce projet.' });
        }

        // Build query
        const query = { project: projectId };

        // If not owner and not admin, restrict to assigned tasks
        if (!isAdmin && !isOwner) {
            query.assignee = req.user._id;
        }

        // Get all tasks for this project
        const tasks = await Task.find(query)
            .populate('assignee', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json(tasks);
    } catch (err) {
        console.error('Erreur récupération tâches:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des tâches.' });
    }
};

const getTasksByIssue = async (req, res) => {
    try {
        const { projectId, issueId } = req.params;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({ error: 'ID non valide.' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }



        // Check permissions
        const isAdmin = req.user.role === 'admin';
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isMember = project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!isAdmin && !isOwner && !isMember) {
            return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas membre de ce projet.' });
        }

        // Build query
        const query = {
            project: projectId,
            issueId: issueId
        };

        // If not owner and not admin, restrict to assigned tasks
        if (!isAdmin && !isOwner) {
            query.assignee = req.user._id;
        }

        // Check if issue exists and belongs to the project
        const issue = await Issue.findOne({ _id: issueId, project: projectId });
        if (!issue) {
            return res.status(404).json({ error: 'Issue non trouvée ou n\'appartient pas au projet.' });
        }

        // Get tasks
        const tasks = await Task.find(query)
            .populate('assignee', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json(tasks);
    } catch (err) {
        console.error('Erreur récupération tâches par issue:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des tâches.' });
    }
};

const updateTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { title, description, status, assignee } = req.body;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: 'ID non valide.' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        // Find the task first to check assignee
        const task = await Task.findOne({ _id: taskId, project: projectId });
        if (!task) {
            return res.status(404).json({ error: 'Tâche non trouvée.' });
        }

        // Check if the associated issue is closed
        const issue = await Issue.findById(task.issueId);
        if (!issue) {
            return res.status(404).json({ error: 'Issue associée non trouvée.' });
        }
        if (issue.status === 'closed') {
            return res.status(400).json({ error: 'Impossible de modifier une tâche liée à une issue fermée.' });
        }

        // Check permissions: Admin OR Owner OR Assignee
        const isAdmin = req.user.role === 'admin';
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner && !isAssignee) {
            return res.status(403).json({ error: 'Accès refusé. Seuls le propriétaire ou l\'assigné peuvent modifier cette tâche.' });
        }

        // Update fields
        if (title !== undefined) task.title = title.trim();
        if (description !== undefined) task.description = description;
        if (status !== undefined) {
            if (!['todo', 'in_progress', 'done'].includes(status)) {
                return res.status(400).json({ error: 'Statut invalide.' });
            }
            task.status = status;
        }
        // Only owner can change assignee
        if (assignee !== undefined) {
            task.assignee = assignee || null;
        }

        await task.save();

        return res.status(200).json(task);
    } catch (err) {
        console.error('Erreur mise à jour tâche:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la tâche.' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: 'ID non valide.' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé.' });
        }

        // Check if user is the project owner or admin
        if (req.user.role !== 'admin' && project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Accès refusé. Seuls les propriétaires peuvent supprimer des tâches.' });
        }

        // Find the task
        const task = await Task.findOne({ _id: taskId, project: projectId });
        if (!task) {
            return res.status(404).json({ error: 'Tâche non trouvée.' });
        }

        // Check if the associated issue is closed
        const issue = await Issue.findById(task.issueId);
        if (!issue) {
            return res.status(404).json({ error: 'Issue associée non trouvée.' });
        }
        if (issue.status === 'closed') {
            return res.status(400).json({ error: 'Impossible de supprimer une tâche liée à une issue fermée.' });
        }

        // Delete the task
        await Task.findByIdAndDelete(taskId);

        return res.status(200).json({ message: 'Tâche supprimée avec succès.' });
    } catch (err) {
        console.error('Erreur suppression tâche:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la suppression de la tâche.' });
    }
};

module.exports = {
    getDeveloperDashboardCounts,
    createTask,
    getTasksByProject,
    getTasksByIssue,
    updateTask,
    deleteTask,
};
