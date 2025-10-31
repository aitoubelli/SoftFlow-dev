// backend/src/server.js
const mongoose = require('mongoose');
const app = require('./app');
const { createAdminIfNotExists } = require('./utils/bootstrapAdmin');
require('dotenv').config();

const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/prodmanager')
    .then(async () => {
        console.log('✅ MongoDB connecté');
        await createAdminIfNotExists();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Backend démarré sur le port ${PORT}`);
        });
    })
    .catch(err => console.error('❌ Erreur MongoDB:', err));
