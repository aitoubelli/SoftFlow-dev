// backend/src/controllers/profile.controller.js
const User = require('../models/User.model');
const Project = require('../models/Project.model');

const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user's basic info
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Get projects where user is owner or member
        const projects = await Project.find({
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ]
        }).select('name description owner members createdAt');

        // Format projects for response
        const formattedProjects = projects.map(project => ({
            _id: project._id,
            name: project.name,
            description: project.description,
            role: project.owner.toString() === userId.toString() ? 'owner' :
                project.members.find(m => m.user.toString() === userId.toString()).role,
            createdAt: project.createdAt
        }));

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            projects: formattedProjects
        });
    } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Update name if provided
        if (name && name.trim()) {
            user.name = name.trim();
        }

        // Update password if provided
        if (newPassword) {
            // Verify current password if changing password
            if (currentPassword) {
                const isCurrentPasswordValid = await user.comparePassword(currentPassword);
                if (!isCurrentPasswordValid) {
                    return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
                }
            } else {
                return res.status(400).json({ error: 'Mot de passe actuel requis pour changer le mot de passe.' });
            }

            // Validate new password
            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
            }

            user.password = newPassword; // Will be hashed by the pre-save middleware
        }

        await user.save();

        res.json({
            message: 'Profil mis à jour avec succès.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du profil:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

module.exports = { getProfile, updateProfile };
