require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model.js');
const Project = require('../src/models/Project.model.js');
const Issue = require('../src/models/Issue.model.js');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
    // nettoyer les données entre les tests
    await User.deleteMany({});
    await Project.deleteMany({});
    await Issue.deleteMany({});
});

describe('Issue API', () => {
    let ownerToken, devToken, projectId;

    beforeEach(async () => {
        // Créer un propriétaire
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Owner', email: 'owner@mail.com', password: '12345678' });

        // Créer un développeur
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Dev', email: 'dev@mail.com', password: '12345678' });

        // Mettre à jour le rôle du propriétaire
        await User.findOneAndUpdate(
            { email: 'owner@mail.com' },
            { role: 'owner' }
        );

        // Se connecter en tant que propriétaire
        const ownerLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'owner@mail.com', password: '12345678' });
        ownerToken = ownerLogin.body.token;

        // Se connecter en tant que développeur
        const devLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'dev@mail.com', password: '12345678' });
        devToken = devLogin.body.token;

        // Créer un projet avec le propriétaire
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'Test Project', description: 'A test project' });

        projectId = projectRes.body._id;
    });

    test('Owner can create an issue successfully', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Test Issue',
                description: 'This is a test issue'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Test Issue');
        expect(res.body.description).toBe('This is a test issue');
        expect(res.body.status).toBe('open');
        expect(res.body.projectId).toBe(projectId);
        expect(res.body.id).toBeDefined();
    });

    test('Owner can create an issue with only title', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Test Issue Minimal'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Test Issue Minimal');
        expect(res.body.description).toBe('');
        expect(res.body.status).toBe('open');
    });

    test('Dev cannot create an issue (403 Forbidden)', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${devToken}`)
            .send({
                title: 'Dev Issue',
                description: 'This should fail'
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Accès refusé. Seuls les propriétaires peuvent créer des issues.');
    });

    test('Creating issue without title returns 400', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                description: 'No title provided'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Le titre de l\'issue est requis.');
    });

    test('Creating issue with invalid project ID returns 400', async () => {
        const res = await request(app)
            .post('/api/projects/invalid-id/issues')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Invalid Project Issue'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('ID de projet non valide.');
    });

    test('Creating issue for non-existent project returns 404', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .post(`/api/projects/${fakeId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Non-existent Project Issue'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Projet non trouvé.');
    });

    test('Creating issue without authentication returns 401', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .send({
                title: 'Unauthenticated Issue'
            });

        expect(res.statusCode).toBe(401);
    });
});
