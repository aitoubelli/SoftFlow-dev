require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const Project = require('../src/models/Project.model');
const Documentation = require('../src/models/Documentation.model');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}, 20000);

afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Documentation.deleteMany({});
});

describe('Documentation API', () => {
    let adminToken, ownerToken, memberToken;
    let adminId, ownerId, memberId;
    let projectId;

    beforeEach(async () => {
        // Create users
        const adminRes = await request(app).post('/api/auth/register').send({ username: 'admin', email: 'admin@test.com', password: 'password' });
        adminId = adminRes.body._id;
        await User.findByIdAndUpdate(adminId, { role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password' });
        adminToken = adminLogin.body.token;

        const ownerRes = await request(app).post('/api/auth/register').send({ username: 'owner', email: 'owner@test.com', password: 'password' });
        ownerId = ownerRes.body._id;
        await User.findByIdAndUpdate(ownerId, { role: 'owner' });
        const ownerLogin = await request(app).post('/api/auth/login').send({ email: 'owner@test.com', password: 'password' });
        ownerToken = ownerLogin.body.token;

        const memberRes = await request(app).post('/api/auth/register').send({ username: 'member', email: 'member@test.com', password: 'password' });
        memberId = memberRes.body._id;
        const memberLogin = await request(app).post('/api/auth/login').send({ email: 'member@test.com', password: 'password' });
        memberToken = memberLogin.body.token;

        // Create project
        const project = await Project.create({ name: 'Test Project', owner: ownerId, members: [{ user: memberId, role: 'dev' }] });
        projectId = project._id;
    });

    describe('POST /api/documentation', () => {
        test('admin should create documentation', async () => {
            const res = await request(app)
                .post('/api/documentation')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Admin Doc',
                    content: '# Content',
                    type: 'admin',
                    projectId: projectId
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.title).toBe('Admin Doc');
            expect(res.body.type).toBe('admin');
        });

        test('owner should create documentation', async () => {
            const res = await request(app)
                .post('/api/documentation')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Owner Doc',
                    content: '# Content',
                    type: 'user',
                    projectId: projectId
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.title).toBe('Owner Doc');
        });

        test('member should NOT create documentation', async () => {
            const res = await request(app)
                .post('/api/documentation')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({
                    title: 'Member Doc',
                    content: '# Content',
                    type: 'user',
                    projectId: projectId
                });

            expect(res.statusCode).toBe(403);
        });
    });

    describe('GET /api/documentation/project/:projectId', () => {
        test('should list documentation for project members', async () => {
            await Documentation.create({ title: 'Doc 1', content: 'C1', type: 'admin', project: projectId });
            await Documentation.create({ title: 'Doc 2', content: 'C2', type: 'user', project: projectId });

            const res = await request(app)
                .get(`/api/documentation/project/${projectId}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });

    describe('PUT /api/documentation/:id', () => {
        let docId;

        beforeEach(async () => {
            const doc = await Documentation.create({ title: 'Original', content: 'Content', type: 'user', project: projectId });
            docId = doc._id;
        });

        test('owner should update documentation', async () => {
            const res = await request(app)
                .put(`/api/documentation/${docId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated' });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Updated');
        });

        test('member should NOT update documentation', async () => {
            const res = await request(app)
                .put(`/api/documentation/${docId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ title: 'Updated' });

            expect(res.statusCode).toBe(403);
        });
    });
});
