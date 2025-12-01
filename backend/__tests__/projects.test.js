require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const Project = require('../src/models/Project.model');
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
});

describe('Projects API', () => {
    let adminToken, ownerToken, memberToken, otherToken;
    let adminId, ownerId, memberId, otherId;

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

        const otherRes = await request(app).post('/api/auth/register').send({ username: 'other', email: 'other@test.com', password: 'password' });
        otherId = otherRes.body._id;
        const otherLogin = await request(app).post('/api/auth/login').send({ email: 'other@test.com', password: 'password' });
        otherToken = otherLogin.body.token;
    });

    describe('GET /api/projects', () => {
        test('should list projects where user is owner or member', async () => {
            // Create projects
            await Project.create({ name: 'Owner Project', owner: ownerId });
            await Project.create({ name: 'Member Project', owner: otherId, members: [{ user: ownerId, role: 'dev' }] });
            await Project.create({ name: 'Other Project', owner: otherId });

            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
            const names = res.body.map(p => p.name);
            expect(names).toContain('Owner Project');
            expect(names).toContain('Member Project');
            expect(names).not.toContain('Other Project');
        });

        test('admin should see all projects', async () => {
            await Project.create({ name: 'P1', owner: ownerId });
            await Project.create({ name: 'P2', owner: otherId });

            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });

    describe('POST /api/projects', () => {
        test('should create a project', async () => {
            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'New Project', description: 'Desc' });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('New Project');
            expect(res.body.owner).toBe(ownerId);
        });

        test('should fail if name is missing', async () => {
            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ description: 'Desc' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/projects/:id', () => {
        test('should return project details', async () => {
            const project = await Project.create({ name: 'Details Project', owner: ownerId });

            const res = await request(app)
                .get(`/api/projects/${project._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Details Project');
        });

        test('should return 404 if not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/projects/${fakeId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('POST /api/projects/:id/assign', () => {
        test('should assign users to project', async () => {
            const project = await Project.create({ name: 'Assign Project', owner: ownerId });

            const res = await request(app)
                .post(`/api/projects/${project._id}/assign`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ userIds: [memberId] });

            expect(res.statusCode).toBe(200);
            expect(res.body.members.length).toBe(1);
            expect(res.body.members[0].user._id).toBe(memberId);
        });

        test('should fail if user already member', async () => {
            const project = await Project.create({ name: 'Assign Project', owner: ownerId, members: [{ user: memberId, role: 'dev' }] });

            const res = await request(app)
                .post(`/api/projects/${project._id}/assign`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ userIds: [memberId] });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/projects/:id/unassign', () => {
        test('should remove user from project', async () => {
            const project = await Project.create({ name: 'Unassign Project', owner: ownerId, members: [{ user: memberId, role: 'dev' }] });

            const res = await request(app)
                .post(`/api/projects/${project._id}/unassign`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ userId: memberId });

            expect(res.statusCode).toBe(200);
            expect(res.body.members.length).toBe(0);
        });
    });

    describe('GET /api/projects/counts', () => {
        test('should return project counts for admin', async () => {
            await Project.create({ name: 'P1', owner: ownerId });
            await Project.create({ name: 'P2', owner: otherId });

            const res = await request(app)
                .get('/api/projects/counts')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.totalProjects).toBe(2);
            expect(res.body.teamMembers).toBe(0);
        });

        test('should return filtered project counts for non-admin', async () => {
            await Project.create({ name: 'Owner Project', owner: ownerId });
            await Project.create({ name: 'Member Project', owner: otherId, members: [{ user: ownerId, role: 'dev' }] });
            await Project.create({ name: 'Other Project', owner: otherId });

            const res = await request(app)
                .get('/api/projects/counts')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.totalProjects).toBe(2); // Owner and member projects
            expect(res.body.teamMembers).toBe(0);
        });

        test('should return 401 without authentication', async () => {
            const res = await request(app)
                .get('/api/projects/counts');

            expect(res.statusCode).toBe(401);
        });
    });
});
