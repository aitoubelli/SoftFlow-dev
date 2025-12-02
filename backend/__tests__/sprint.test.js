require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const Project = require('../src/models/Project.model');
const Sprint = require('../src/models/Sprint.model');
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
    await User.deleteMany({});
    await Project.deleteMany({});
    await Sprint.deleteMany({});
});

describe('Sprint API', () => {
    let adminToken, ownerToken, devToken, projectId;

    beforeEach(async () => {
        // Create admin
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Admin', email: 'admin@test.com', password: 'password' });
        const adminUser = await User.findOne({ email: 'admin@test.com' });
        await User.findByIdAndUpdate(adminUser._id, { role: 'admin' });
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'password' });
        adminToken = adminLogin.body.token;

        // Create owner
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Owner', email: 'owner@test.com', password: 'password' });
        const ownerUser = await User.findOne({ email: 'owner@test.com' });
        await User.findByIdAndUpdate(ownerUser._id, { role: 'owner' });
        const ownerLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'owner@test.com', password: 'password' });
        ownerToken = ownerLogin.body.token;

        // Create dev
        await request(app)
            .post('/api/auth/register')
            .send({ name: 'Dev', email: 'dev@test.com', password: 'password' });
        const devLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'dev@test.com', password: 'password' });
        devToken = devLogin.body.token;

        // Create project
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'Test Project', description: 'A test project' });
        projectId = projectRes.body._id;
    });

    describe('POST /api/projects/:projectId/sprints', () => {
        test('Owner can create sprint successfully', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

            const res = await request(app)
                .post(`/api/projects/${projectId}/sprints`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Sprint',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Test Sprint');
            expect(res.body.project).toBe(projectId);
        });

        test('Admin can create sprint successfully', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const res = await request(app)
                .post(`/api/projects/${projectId}/sprints`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Admin Sprint',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Admin Sprint');
        });

        test('Dev cannot create sprint (403 Forbidden)', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const res = await request(app)
                .post(`/api/projects/${projectId}/sprints`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    name: 'Dev Sprint',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Non autorisé à créer un sprint pour ce projet.');
        });

        test('Creating sprint with invalid project ID returns 400', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const res = await request(app)
                .post('/api/projects/invalid-id/sprints')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Invalid Project Sprint',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID de projet non valide.');
        });

        test('Creating sprint for non-existent project returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const res = await request(app)
                .post(`/api/projects/${fakeId}/sprints`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Non-existent Project Sprint',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Sprint Controller: Projet non trouvé (DB lookup failed).');
        });

        test('Creating sprint without name returns 400', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const res = await request(app)
                .post(`/api/projects/${projectId}/sprints`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Nom, date de début et date de fin requis.');
        });

        test('Creating sprint with end date before start date returns 400', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before

            const res = await request(app)
                .post(`/api/projects/${projectId}/sprints`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Invalid Dates Sprint',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('La date de fin doit être après la date de début.');
        });

        test('Creating sprint without authentication returns 401', async () => {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            const res = await request(app)
                .post(`/api/projects/${projectId}/sprints`)
                .send({
                    name: 'Unauthenticated Sprint',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/projects/:projectId/sprints', () => {
        test('Should get sprints for project successfully', async () => {
            // Create a sprint
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            await Sprint.create({
                name: 'Test Sprint',
                project: projectId,
                startDate,
                endDate
            });

            const res = await request(app)
                .get(`/api/projects/${projectId}/sprints`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Test Sprint');
        });

        test('Should return empty array for project with no sprints', async () => {
            const res = await request(app)
                .get(`/api/projects/${projectId}/sprints`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('Getting sprints with invalid project ID returns 400', async () => {
            const res = await request(app)
                .get('/api/projects/invalid-id/sprints')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID de projet non valide.');
        });

        test('Getting sprints without authentication returns 401', async () => {
            const res = await request(app)
                .get(`/api/projects/${projectId}/sprints`);

            expect(res.statusCode).toBe(401);
        });
    });
});
