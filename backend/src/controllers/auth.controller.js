// backend/src/controllers/auth.controller.js
const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        // accepter soit `name` soit `username` (compatibilité avec les tests/clients)
        const { username, name, email, password } = req.body;
        const displayName = name || username;

        if (!displayName || !email || !password) {
            return res.status(400).json({ error: 'Champs manquants.' });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }

        // Créer l'utilisateur (rôle 'dev' par défaut)
        const user = new User({ name: displayName, email, password, role: 'dev' });
        await user.save();

        // Ne pas renvoyer le mot de passe
        const { password: _, ...userResponse } = user.toObject();
        res.status(201).json(userResponse);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
        }

        // Générer un JWT (valide 7 jours)
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'softflow-secret-key',
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

const getProfile = (req, res) => {
    res.json({ user: req.user });
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name email role');

        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: user.name || 'Unknown User',
            email: user.email,
            role: user.role || 'dev'
        }));
        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'owner', 'dev'].includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide.' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // Prevent an admin from downgrading their own role
        if (req.user.id === id && req.user.role === 'admin' && role !== 'admin') {
            return res.status(403).json({ error: 'Vous ne pouvez pas rétrograder votre propre rôle administrateur.' });
        }

        user.role = role;
        await user.save();

        res.json({ message: 'Rôle utilisateur mis à jour avec succès.', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

const getUserCountsByRole = async (req, res) => {
    try {
        const adminCount = await User.countDocuments({ role: 'admin' });
        const ownerCount = await User.countDocuments({ role: 'owner' });
        const devCount = await User.countDocuments({ role: 'dev' });
        const totalUsers = await User.countDocuments();

        res.json({
            totalUsers,
            adminCount,
            ownerCount,
            devCount,
        });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

module.exports = { register, login, getProfile, getAllUsers, updateUserRole, getUserCountsByRole };
