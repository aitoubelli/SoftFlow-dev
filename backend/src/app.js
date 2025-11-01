const express = require('express');
const cors = require('cors');
const healthRoute = require('./routes/health.route');
const projectsRoute = require('./routes/projects.route');

const app = express();


app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use('/api/health', healthRoute);
app.use('/api/projects', projectsRoute);

module.exports = app;
