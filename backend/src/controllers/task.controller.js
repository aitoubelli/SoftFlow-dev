const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
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

module.exports = {
    getDeveloperDashboardCounts,
};
