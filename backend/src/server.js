const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/prodmanager';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connecté'))
    .catch(err => console.error('❌ MongoDB erreur:', err));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend démarré sur le port ${PORT}`);
});
