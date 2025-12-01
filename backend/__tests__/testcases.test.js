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
}, 20000);

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

describe('Test Cases API', () => {
    let ownerToken, devToken, nonMemberDevToken, adminToken;
    let ownerId, devId, nonMemberDevId, adminId, projectId, taskId, issueId;

    beforeEach(async () => {
        // Create owner user
        const ownerRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'owner', email: 'owner@test.com', password: 'password' });
        ownerId = ownerRes.body._id;
        await User.findByIdAndUpdate(ownerId, { role: 'owner' });
        const ownerLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'owner@test.com', password: 'password' });
        ownerToken = ownerLogin.body.token;

        // Create developer (project member)
        const devRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'dev', email: 'dev@test.com', password: 'password' });
        devId = devRes.body._id;
        await User.findByIdAndUpdate(devId, { role: 'dev' });
        const devLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'dev@test.com', password: 'password' });
        devToken = devLogin.body.token;

        // Create non-member developer
        const nonMemberDevRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'nonmemberdev', email: 'nonmemberdev@test.com', password: 'password' });
        nonMemberDevId = nonMemberDevRes.body._id;
        await User.findByIdAndUpdate(nonMemberDevId, { role: 'dev' });
        const nonMemberDevLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nonmemberdev@test.com', password: 'password' });
        nonMemberDevToken = nonMemberDevLogin.body.token;

        // Create admin user
        const adminRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'admin', email: 'admin@test.com', password: 'password' });
        adminId = adminRes.body._id;
        await User.findByIdAndUpdate(adminId, { role: 'admin' });
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'password' });
        adminToken = adminLogin.body.token;

        // Create project with developer as member
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Test Project',
                description: 'Test Description'
            });
        projectId = projectRes.body._id;

        // Add developer as project member
        await Project.findByIdAndUpdate(projectId, {
            $push: { members: { user: devId, role: 'dev' } }
        });

        // Create issue for the project
        const issueRes = await request(app)
            .post(`/api/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Test Issue',
                description: 'Test Issue Description',
                projectId: projectId
            });
        issueId = issueRes.body._id;

        // Create task assigned to developer
        const taskRes = await request(app)
            .post(`/api/tasks/projects/${projectId}/tasks`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Test Task',
                description: 'Test Task Description',
                issueId: issueId
            });
        taskId = taskRes.body._id;

        // Update task to assign to developer
        await Task.findByIdAndUpdate(taskId, { assignee: devId });
    });

    describe('POST /api/testcases/projects/:projectId/testcases', () => {
        it('should create a test case as owner', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case 1',
                    description: 'Test description',
                    taskId: taskId,
                    release: 'v1.0'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.name).toBe('Test Case 1');
            expect(res.body.status).toBe('pending');
            expect(res.body.task).toBeDefined();
            expect(res.body.task._id).toBe(taskId);
            expect(res.body.createdBy).toBeDefined();
        });

        it('should fail to create test case without authentication', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .send({
                    name: 'Test Case 1',
                    description: 'Test description'
                });

            expect(res.statusCode).toBe(401);
        });

        it('should fail to create test case as non-owner/non-admin', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    name: 'Test Case 1',
                    description: 'Test description'
                });

            expect(res.statusCode).toBe(403);
        });

        it('should create test case without task', async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case Without Task',
                    description: 'No task linked',
                    release: 'v2.0'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.task).toBeUndefined();
            expect(res.body.release).toBe('v2.0');
        });
    });

    describe('GET /api/testcases/projects/:projectId/testcases', () => {
        beforeEach(async () => {
            // Create test cases
            await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case 1',
                    description: 'Description 1',
                    taskId: taskId
                });

            await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case 2',
                    description: 'Description 2'
                });
        });

        it('should get all test cases for a project', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].name).toBeDefined();
            expect(res.body[0].createdBy.name).toBeDefined();
        });

        it('should get test cases with task assignee populated', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            const testCaseWithTask = res.body.find(tc => tc.task && tc.task._id);
            expect(testCaseWithTask).toBeDefined();
            expect(testCaseWithTask.task.assignee).toBeDefined();
            expect(testCaseWithTask.task.assignee.name).toBe('dev');
        });

        it('should require authentication', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`);

            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /api/testcases/projects/:projectId/testcases/:testCaseId', () => {
        let testCaseId;

        beforeEach(async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Original Test Case',
                    description: 'Original description',
                    taskId: taskId,
                    release: 'v1.0'
                });
            testCaseId = res.body._id;
        });

        it('should update all fields as owner', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Updated Test Case',
                    description: 'Updated description',
                    status: 'passed',
                    release: 'v2.0'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Updated Test Case');
            expect(res.body.description).toBe('Updated description');
            expect(res.body.status).toBe('passed');
            expect(res.body.release).toBe('v2.0');
        });

        it('should update only status as developer (project member)', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    status: 'failed'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('failed');
            expect(res.body.name).toBe('Original Test Case'); // Name unchanged
        });

        it('should fail when developer tries to update other fields', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({
                    name: 'Hacked Name',
                    status: 'passed'
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toContain('développeurs ne peuvent modifier que le statut');
        });

        it('should fail when non-member developer tries to update', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${nonMemberDevToken}`)
                .send({
                    status: 'passed'
                });

            expect(res.statusCode).toBe(403);
        });

        it('should update all fields as admin', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Admin Updated',
                    description: 'Admin description',
                    status: 'passed',
                    release: 'v3.0'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Admin Updated');
            expect(res.body.status).toBe('passed');
        });

        it('should fail with invalid test case ID', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/invalidid123`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    status: 'passed'
                });

            expect(res.statusCode).toBe(500);
        });
    });

    describe('DELETE /api/testcases/projects/:projectId/testcases/:testCaseId', () => {
        let testCaseId;

        beforeEach(async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case to Delete',
                    description: 'Will be deleted'
                });
            testCaseId = res.body._id;
        });

        it('should delete test case as owner', async () => {
            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('deleted');

            // Verify deletion
            const getRes = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);
            expect(getRes.body.length).toBe(0);
        });

        it('should fail to delete as developer', async () => {
            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should delete test case as admin', async () => {
            const res = await request(app)
                .delete(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
        });
    });

    describe('GET /api/testcases/projects/:projectId/tasks/:taskId/testcases', () => {
        beforeEach(async () => {
            // Create test cases for the task
            await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case for Task',
                    taskId: taskId
                });

            // Create test case without task
            await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Test Case Without Task'
                });
        });

        it('should get test cases for a specific task', async () => {
            expect(taskId).toBeDefined();
            
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/tasks/${taskId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Test Case for Task');
        });
    });

    describe('Status transitions', () => {
        let testCaseId;

        beforeEach(async () => {
            const res = await request(app)
                .post(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Status Test Case',
                    taskId: taskId
                });
            testCaseId = res.body._id;
        });

        it('should have pending status by default', async () => {
            const res = await request(app)
                .get(`/api/testcases/projects/${projectId}/testcases`)
                .set('Authorization', `Bearer ${ownerToken}`);

            const testCase = res.body.find(tc => tc._id === testCaseId);
            expect(testCase.status).toBe('pending');
        });

        it('should transition from pending to passed', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({ status: 'passed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('passed');
        });

        it('should transition from pending to failed', async () => {
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({ status: 'failed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('failed');
        });

        it('should allow changing status multiple times', async () => {
            // pending -> passed
            await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({ status: 'passed' });

            // passed -> failed
            const res = await request(app)
                .put(`/api/testcases/projects/${projectId}/testcases/${testCaseId}`)
                .set('Authorization', `Bearer ${devToken}`)
                .send({ status: 'failed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('failed');
        });
    });
});
