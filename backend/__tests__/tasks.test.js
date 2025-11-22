require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const Project = require('../src/models/Project.model');
const Task = require('../src/models/Task.model');
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
    await Task.deleteMany({});
});

describe('Tasks API', () => {
    let ownerToken, memberToken;
    let ownerId, memberId, projectId;
    let issueId;

    beforeEach(async () => {
        // Create users
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
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'Task Project' });
        projectId = projectRes.body._id;

        // Assign member
        await request(app)
            .post(`/api/projects/${projectId}/assign`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ userIds: [memberId] });

        // Create issue
        const issueRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Test Issue', projectId });
        issueId = issueRes.body._id;
    });

    describe('POST /api/tasks/projects/:projectId/tasks', () => {
        test('should create a task', async () => {
            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'New Task', description: 'Task Desc', priority: 'high', issueId });

            expect(res.statusCode).toBe(201);
            expect(res.body.title).toBe('New Task');
            expect(res.body.project).toBe(projectId);
        });
    });

    describe('GET /api/tasks/projects/:projectId/tasks', () => {
        test('should list tasks for a project', async () => {
            await Task.create({ title: 'Task 1', project: projectId, createdBy: ownerId, issueId, status: 'todo' });
            await Task.create({ title: 'Task 2', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`); // Use owner to see all tasks

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });
    });

    describe('PUT /api/tasks/projects/:projectId/tasks/:taskId', () => {
        test('should update a task', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Updated Title');
        });
    });

    describe('DELETE /api/tasks/projects/:projectId/tasks/:taskId', () => {
        test('should delete a task', async () => {
            const task = await Task.create({ title: 'Delete Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .delete(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);

            const check = await Task.findById(task._id);
            expect(check).toBeNull();
        });
    });
});
