// backend/src/utils/bootstrapAdmin.js
const User = require('../models/User.model');

const createAdminIfNotExists = async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.warn('⚠️ ADMIN_EMAIL ou ADMIN_PASSWORD non définis — pas de bootstrap admin.');
        return;
    }

    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
        const admin = new User({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
        await admin.save();
        console.log(`✅ Compte admin créé : ${adminEmail}`);
    } else {
        console.log('ℹ️ Compte admin déjà existant.');
    }
};

module.exports = { createAdminIfNotExists };
