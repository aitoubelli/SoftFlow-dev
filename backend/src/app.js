// backend/src/app.js
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');
const authRoutes = require('./routes/auth.routes');
const healthRoute = require('./routes/health.route');
const projectsRoute = require('./routes/projects.route');
const usersRoutes = require('./routes/users.routes');
const tasksRoutes = require('./routes/tasks.route');
const issuesRoutes = require('./routes/issues.route');
const profileRoutes = require('./routes/profile.routes');
const { protect } = require('./middleware/auth.middleware');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Swagger UI documentation (unprotected for development)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'softflow-api' });
});
app.use('/api/health', healthRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/tasks', tasksRoutes); // Add tasks routes
app.use('/api/issues', issuesRoutes);
app.use('/api', profileRoutes);

module.exports = app;
