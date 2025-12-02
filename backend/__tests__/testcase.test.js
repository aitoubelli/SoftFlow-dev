require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const Project = require('../src/models/Project.model');
const Task = require('../src/models/Task.model');
const TestCase = require('../src/models/TestCase.model');
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
    await Task.deleteMany({});
    await TestCase.deleteMany({});
});

describe('TestCase API', () => {
    let adminToken, ownerToken, devToken, projectId, taskId;

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

        // Create issue
        const issueRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Test Issue', description: 'A test issue', projectId });
        const issueId = issueRes.body._id;

        // Create task
        const taskRes = await request(app)
            .post(`/api/tasks/projects/${projectId}/tasks`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Test Task', description: 'A test task', issueId });
        taskId = taskRes.body._id;
    });

    describe('POST /api/testcases/projects/:projectId/testcases', () => {
        test('Owner can create test case successfully', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case 1',
                    description: 'Description',
                    taskId,
                    release: '1.0'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Test Case 1');
            expect(res.body.project).toBe(projectId);
            expect(res.body.task._id).toBe(taskId);
        });

        test('Admin can create test case successfully', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Admin Test Case',
                    description: 'Description'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Admin Test Case');
        });

        test('Dev cannot create test case (403 Forbidden)', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    name: 'Dev Test Case',
                    description: 'Description'
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Accès réservé aux administrateurs ou propriétaires.');
        });

        test('Creating test case for non-existent project returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post(`/api/testcases/projects/${fakeId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case',
                    description: 'Description'
                });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Project not found');
        });

        test('Creating test case with invalid task ID returns 404', async () => {
            const fakeTaskId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case',
                    description: 'Description',
                    taskId: fakeTaskId
                });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Task not found in this project');
        });

        test('Creating test case without authentication returns 401', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .send({
                    name: 'Test Case',
                    description: 'Description'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/testcases/projects/:projectId/testcases', () => {
        test('Should get test cases for project successfully', async () => {
            // Create a test case
            await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case for Get',
                    description: 'Description',
                    taskId
                });

            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Test Case for Get');
        });

        test('Should return empty array for project with no test cases', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('Getting test cases without authentication returns 401', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/testcases/projects/:projectId/tasks/:taskId/testcases', () => {
        test('Should get test cases for specific task successfully', async () => {
            // Create a test case for the task
            await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Task Test Case',
                    description: 'Description',
                    taskId
                });

            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/tasks/${taskId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Task Test Case');
        });

        test('Should return empty array for task with no test cases', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/tasks/${taskId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('Getting test cases for task without authentication returns 401', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/tasks/${taskId}/testcases`);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /api/testcases/projects/:projectId/testcases/:testCaseId', () => {
        test('Owner can update test case successfully', async () => {
            // Create a test case
            const createRes = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Original Test Case',
                    description: 'Original Description',
                    taskId
                });
            const testCaseId = createRes.body._id;

            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Updated Test Case',
                    description: 'Updated Description',
                    status: 'passed'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Updated Test Case');
            expect(res.body.status).toBe('passed');
        });

        test('Dev member can update test case status', async () => {
            // Add dev as member
            await Project.findByIdAndUpdate(projectId, {
                $push: { members: { user: (await User.findOne({ email: 'dev@test.com' }))._id, role: 'developer' } }
            });

            // Create a test case
            const createRes = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case for Dev Update',
                    description: 'Description'
                });
            const testCaseId = createRes.body._id;

            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({ status: 'failed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('failed');
        });

        test('Dev non-member cannot update test case (403 Forbidden)', async () => {
            // Create a test case
            const createRes = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case for Non-Member Dev',
                    description: 'Description'
                });
            const testCaseId = createRes.body._id;

            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({ status: 'passed' });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('Not authorized to update test cases for this project');
        });

        test('Updating non-existent test case returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${fakeId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'New Name' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Test case not found');
        });

        test('Updating test case without authentication returns 401', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${fakeId}`)
                .send({ name: 'New Name' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('DELETE /api/testcases/projects/:projectId/testcases/:testCaseId', () => {
        test('Owner can delete test case successfully', async () => {
            // Create a test case
            const createRes = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case to Delete',
                    description: 'Description'
                });
            const testCaseId = createRes.body._id;

            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Test case deleted successfully');

            // Verify it's deleted
            const getRes = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(getRes.body.length).toBe(0);
        });

        test('Admin can delete test case successfully', async () => {
            // Create a test case
            const createRes = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case for Admin Delete',
                    description: 'Description'
                });
            const testCaseId = createRes.body._id;

            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Test case deleted successfully');
        });

        test('Dev cannot delete test case (403 Forbidden)', async () => {
            // Create a test case
            const createRes = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case for Dev Delete',
                    description: 'Description'
                });
            const testCaseId = createRes.body._id;

            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Accès réservé aux administrateurs ou propriétaires.');
        });

        test('Deleting non-existent test case returns 404', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${fakeId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Test case not found');
        });

        test('Deleting test case without authentication returns 401', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${fakeId}`);

            expect(res.statusCode).toBe(401);
        });
    });
});
