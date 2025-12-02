const Project = require('../models/Project.model');

const getProjectCounts = async (req, res) => {
    try {
        let query = {};

        // If user is not admin, filter projects where user is owner or member
        if (req.user.role !== 'admin') {
            query = {
                $or: [
                    { owner: req.user._id },
                    { 'members.user': req.user._id }
                ]
            };
        }

        const totalProjects = await Project.countDocuments(query);
        // Assuming 'status' field for projects, or inferring 'in progress'/'completed'
        // For now, let's assume all projects are 'in progress' if no status field exists
        // Or, we can add a 'status' field to the Project model later if needed.
        // For demonstration, let's just return total projects.
        // If there was a 'status' field:
        // const inProgressProjects = await Project.countDocuments({ ...query, status: 'in_progress' });
        // const completedProjects = await Project.countDocuments({ ...query, status: 'completed' });

        res.json({
            totalProjects,
            // inProgressProjects,
            // completedProjects,
            teamMembers: 0 // This would require more complex aggregation or a separate endpoint
        });
    } catch (err) {
        console.error('Erreur récupération des comptes de projets:', err);
        return res.status(500).json({ error: 'Erreur serveur lors de la récupération des comptes de projets.' });
    }
};

module.exports = {
    getProjectCounts,
};
