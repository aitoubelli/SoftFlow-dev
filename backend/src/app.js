// backend/src/app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const healthRoute = require('./routes/health.route');
const projectsRoute = require('./routes/projects.route');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'softflow-api' });
});
app.use('/api/health', healthRoute);
app.use('/api/projects', projectsRoute);

module.exports = app;
