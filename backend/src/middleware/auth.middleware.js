// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'softflow-secret-key');
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (_) {
        res.status(401).json({ error: 'Token invalide ou expiré.' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }
};

const adminOrOwnerOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
        next();
    } else {
        res.status(403).json({ error: 'Accès réservé aux administrateurs ou propriétaires.' });
    }
};

const developerOnly = (req, res, next) => {
    if (req.user && req.user.role === 'dev') {
        next();
    } else {
        res.status(403).json({ error: 'Accès réservé aux développeurs.' });
    }
};

const canUpdateTestCase = (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: 'Non autorisé.' });
    }
    
    // Admin and Owner can update everything
    if (req.user.role === 'admin' || req.user.role === 'owner') {
        return next();
    }
    
    // Developers can only update the status field
    if (req.user.role === 'dev') {
        const allowedFields = ['status'];
        const requestedFields = Object.keys(req.body);
        const hasOtherFields = requestedFields.some(field => !allowedFields.includes(field));
        
        if (hasOtherFields) {
            return res.status(403).json({ error: 'Les développeurs ne peuvent modifier que le statut des fiches de test.' });
        }
        return next();
    }
    
    res.status(403).json({ error: 'Accès refusé.' });
};

module.exports = { protect, adminOnly, adminOrOwnerOnly, developerOnly, canUpdateTestCase };
