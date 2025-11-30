// backend/src/app.js
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const authRoutes = require('./routes/auth.routes');
const healthRoute = require('./routes/health.route');
const projectsRoute = require('./routes/projects.route');
const usersRoutes = require('./routes/users.routes');
const tasksRoutes = require('./routes/tasks.route');
const issuesRoutes = require('./routes/issues.route');
const profileRoutes = require('./routes/profile.routes');
const sprintRoutes = require('./routes/sprint.routes');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Swagger UI documentation (unprotected for development) - auto-generated
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', usersRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'softflow-api' });
});
app.use('/api/health', healthRoute);
app.use('/api/projects', sprintRoutes);
app.use('/api/projects', projectsRoute);
app.use('/api/tasks', tasksRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api', profileRoutes);

module.exports = app;
