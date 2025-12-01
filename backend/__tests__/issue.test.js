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
                description: 'This is a test issue',
                projectId
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Test Issue');
        expect(res.body.description).toBe('This is a test issue');
        expect(res.body.status).toBe('open');
        expect(res.body.project).toBe(projectId);
        expect(res.body._id).toBeDefined();
    });

    test('Owner can create an issue with only title', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Test Issue Minimal',
                projectId
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
                description: 'This should fail',
                projectId
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Access denied. Only project owners can create issues.');
    });

    test('Creating issue without title returns 400', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                description: 'No title provided',
                projectId
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Issue validation failed: title: Path `title` is required.');
    });

    test('Creating issue with invalid project ID returns 400', async () => {
        const res = await request(app)
            .post('/api/projects/invalid-id/issues')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Invalid Project Issue',
                projectId: 'invalid-id'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Cast to ObjectId failed');
    });

    test('Creating issue for non-existent project returns 404', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .post(`/api/projects/${fakeId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Non-existent Project Issue',
                projectId: fakeId
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Project not found.');
    });

    test('Creating issue without authentication returns 401', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .send({
                title: 'Unauthenticated Issue'
            });

        expect(res.statusCode).toBe(401);
    });

    test('Owner can get issues for their project successfully', async () => {
        // Create an issue first
        await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Test Issue for Get',
                description: 'Description',
                projectId
            });

        const res = await request(app)
            .get(`/api/issues/project/${projectId}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Test Issue for Get');
        expect(res.body[0].createdBy.name).toBe('Owner');
    });

    test('Getting issues for project with no issues returns empty array', async () => {
        const res = await request(app)
            .get(`/api/issues/project/${projectId}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    test('Getting issues for non-existent project returns 404', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .get(`/api/issues/project/${fakeId}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Project not found.');
    });

    test('Getting issues with invalid project ID returns 500', async () => {
        const res = await request(app)
            .get('/api/issues/project/invalid-id')
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    });

    test('Getting issues without authentication returns 401', async () => {
        const res = await request(app)
            .get(`/api/issues/project/${projectId}`);

        expect(res.statusCode).toBe(401);
    });

    test('Owner can update issue status to closed', async () => {
        // Create an issue
        const createRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Issue to Update',
                description: 'Description',
                projectId
            });
        const issueId = createRes.body._id;

        const res = await request(app)
            .patch(`/api/issues/${issueId}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'closed' });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('closed');
        expect(res.body.closedAt).toBeDefined();
    });

    test('Owner can update issue title and description', async () => {
        // Create an issue
        const createRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Original Title',
                description: 'Original Description',
                projectId
            });
        const issueId = createRes.body._id;

        const res = await request(app)
            .patch(`/api/issues/${issueId}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Updated Title',
                description: 'Updated Description'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Updated Title');
        expect(res.body.description).toBe('Updated Description');
    });

    test('Dev cannot update issue (403 Forbidden)', async () => {
        // Create an issue
        const createRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Issue for Dev Update',
                projectId
            });
        const issueId = createRes.body._id;

        const res = await request(app)
            .patch(`/api/issues/${issueId}`)
            .set('Authorization', `Bearer ${devToken}`)
            .send({ status: 'closed' });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Only the project owner can modify issues.');
    });

    test('Updating non-existent issue returns 404', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch(`/api/issues/${fakeId}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'New Title' });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Issue not found.');
    });

    test('Updating issue with invalid ID returns 400', async () => {
        const res = await request(app)
            .patch('/api/issues/invalid-id')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'New Title' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test('Updating issue without authentication returns 401', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .patch(`/api/issues/${fakeId}`)
            .send({ title: 'New Title' });

        expect(res.statusCode).toBe(401);
    });

    test('Owner can delete issue successfully', async () => {
        // Create an issue
        const createRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Issue to Delete',
                projectId
            });
        const issueId = createRes.body._id;

        const res = await request(app)
            .delete(`/api/issues/${issueId}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Issue deleted successfully.');

        // Verify it's deleted
        const getRes = await request(app)
            .get(`/api/issues/project/${projectId}`)
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(getRes.body.length).toBe(0);
    });

    test('Dev cannot delete issue (403 Forbidden)', async () => {
        // Create an issue
        const createRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Issue for Dev Delete',
                projectId
            });
        const issueId = createRes.body._id;

        const res = await request(app)
            .delete(`/api/issues/${issueId}`)
            .set('Authorization', `Bearer ${devToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('Only the project owner can delete issues.');
    });

    test('Deleting non-existent issue returns 404', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/issues/${fakeId}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('Issue not found.');
    });

    test('Deleting issue with invalid ID returns 500', async () => {
        const res = await request(app)
            .delete('/api/issues/invalid-id')
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBeDefined();
    });

    test('Deleting issue without authentication returns 401', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/issues/${fakeId}`);

        expect(res.statusCode).toBe(401);
    });
});
