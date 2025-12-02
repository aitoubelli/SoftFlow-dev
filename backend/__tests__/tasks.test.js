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
    let ownerToken, memberToken, developerToken, adminToken;
    let ownerId, memberId, developerId, adminId, projectId, otherProjectId;
    let issueId, closedIssueId;

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

        const developerRes = await request(app).post('/api/auth/register').send({ username: 'developer', email: 'developer@test.com', password: 'password' });
        developerId = developerRes.body._id;
        await User.findByIdAndUpdate(developerId, { role: 'dev' });
        const developerLogin = await request(app).post('/api/auth/login').send({ email: 'developer@test.com', password: 'password' });
        developerToken = developerLogin.body.token;

        const adminRes = await request(app).post('/api/auth/register').send({ username: 'admin', email: 'admin@test.com', password: 'password' });
        adminId = adminRes.body._id;
        await User.findByIdAndUpdate(adminId, { role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password' });
        adminToken = adminLogin.body.token;

        // Create projects
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'Task Project' });
        projectId = projectRes.body._id;

        const otherProjectRes = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'Other Project' });
        otherProjectId = otherProjectRes.body._id;

        // Assign member and developer to projects
        await request(app)
            .post(`/api/projects/${projectId}/assign`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ userIds: [memberId, developerId] });

        await request(app)
            .post(`/api/projects/${otherProjectId}/assign`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ userIds: [developerId] });

        // Create issues
        const issueRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Test Issue', projectId });
        issueId = issueRes.body._id;

        const closedIssueRes = await request(app)
            .post(`/api/projects/${projectId}/issues`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Closed Issue', projectId });
        closedIssueId = closedIssueRes.body._id;

        // Close the issue
        await request(app)
            .put(`/api/projects/${projectId}/issues/${closedIssueId}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ status: 'closed' });
    });

    describe('GET /api/tasks/counts', () => {
        test('should return developer dashboard counts', async () => {
            // Create some tasks for the developer
            await Task.create({
                title: 'In Progress Task',
                project: projectId,
                issueId,
                assignee: developerId,
                status: 'in_progress'
            });
            await Task.create({
                title: 'Completed Task',
                project: projectId,
                issueId,
                assignee: developerId,
                status: 'done'
            });
            await Task.create({
                title: 'Bug Task',
                project: projectId,
                issueId,
                assignee: developerId,
                status: 'todo'
            });

            const res = await request(app)
                .get('/api/tasks/counts')
                .set('Authorization', `Bearer ${developerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('assignedProjectsCount');
            expect(res.body).toHaveProperty('inProgressTasksCount');
            expect(res.body).toHaveProperty('reportedBugsCount');
            expect(res.body).toHaveProperty('completedTasksCount');
            expect(res.body.assignedProjectsCount).toBe(2); // projectId and otherProjectId
            expect(res.body.inProgressTasksCount).toBe(1);
            expect(res.body.completedTasksCount).toBe(1);
            expect(res.body.reportedBugsCount).toBe(1);
        });

        test('should return 403 for non-developer users', async () => {
            const res = await request(app)
                .get('/api/tasks/counts')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(403);
        });
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

        test('should return 400 for missing title', async () => {
            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ description: 'Task Desc', issueId });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Le titre de la tâche est requis.');
        });

        test('should return 400 for empty title', async () => {
            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: '   ', issueId });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Le titre de la tâche est requis.');
        });

        test('should return 400 for missing issueId', async () => {
            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'New Task' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('L\'ID de l\'issue est requis.');
        });

        test('should return 400 for invalid projectId', async () => {
            const res = await request(app)
                .post('/api/tasks/projects/invalid-id/tasks')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'New Task', issueId });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 400 for invalid issueId', async () => {
            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'New Task', issueId: 'invalid-id' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 404 for non-existent project', async () => {
            const fakeProjectId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .post(`/api/tasks/projects/${fakeProjectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'New Task', issueId });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Projet non trouvé.');
        });

        test('should return 403 for non-owner non-admin user', async () => {
            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ title: 'New Task', issueId });

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Accès refusé. Seuls les propriétaires peuvent créer des tâches.');
        });

        test('should return 404 for issue not belonging to project', async () => {
            const otherProjectRes = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Other Project' });
            const otherProjectId = otherProjectRes.body._id;

            const otherIssueRes = await request(app)
                .post(`/api/projects/${otherProjectId}/issues`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Other Issue', projectId: otherProjectId });

            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'New Task', issueId: otherIssueRes.body._id });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Issue non trouvée ou n\'appartient pas au projet.');
        });

        test('should return 400 for closed issue', async () => {
            const res = await request(app)
                .post(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'New Task', issueId: closedIssueId });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Impossible de créer une tâche pour une issue fermée.');
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

        test('should return 400 for invalid projectId', async () => {
            const res = await request(app)
                .get('/api/tasks/projects/invalid-id/tasks')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID de projet non valide.');
        });

        test('should return 404 for non-existent project', async () => {
            const fakeProjectId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .get(`/api/tasks/projects/${fakeProjectId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Projet non trouvé.');
        });

        test('should return 403 for user not member of project', async () => {
            // Create a separate user not in the project
            const outsiderRes = await request(app).post('/api/auth/register').send({ username: 'outsider', email: 'outsider@test.com', password: 'password' });
            const outsiderId = outsiderRes.body._id;
            const outsiderLogin = await request(app).post('/api/auth/login').send({ email: 'outsider@test.com', password: 'password' });
            const outsiderToken = outsiderLogin.body.token;

            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${outsiderToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Accès refusé. Vous n\'êtes pas membre de ce projet.');
        });

        test('should return only assigned tasks for non-owner non-admin members', async () => {
            await Task.create({ title: 'Assigned Task', project: projectId, createdBy: ownerId, issueId, assignee: memberId, status: 'todo' });
            await Task.create({ title: 'Unassigned Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Assigned Task');
        });
    });

    describe('GET /api/tasks/projects/:projectId/issues/:issueId/tasks', () => {
        test('should list tasks for an issue', async () => {
            await Task.create({ title: 'Issue Task 1', project: projectId, createdBy: ownerId, issueId, status: 'todo' });
            await Task.create({ title: 'Issue Task 2', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/issues/${issueId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });

        test('should return 400 for invalid projectId', async () => {
            const res = await request(app)
                .get(`/api/tasks/projects/invalid-id/issues/${issueId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 400 for invalid issueId', async () => {
            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/issues/invalid-id/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 404 for non-existent project', async () => {
            const fakeProjectId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .get(`/api/tasks/projects/${fakeProjectId}/issues/${issueId}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Projet non trouvé.');
        });

        test('should return 403 for user not member of project', async () => {
            // Create a separate user not in the project
            const outsiderRes = await request(app).post('/api/auth/register').send({ username: 'outsider2', email: 'outsider2@test.com', password: 'password' });
            const outsiderId = outsiderRes.body._id;
            const outsiderLogin = await request(app).post('/api/auth/login').send({ email: 'outsider2@test.com', password: 'password' });
            const outsiderToken = outsiderLogin.body.token;

            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/issues/${issueId}/tasks`)
                .set('Authorization', `Bearer ${outsiderToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Accès refusé. Vous n\'êtes pas membre de ce projet.');
        });

        test('should return 404 for issue not belonging to project', async () => {
            const otherProjectRes = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Other Project 2' });
            const otherProjectId = otherProjectRes.body._id;

            const otherIssueRes = await request(app)
                .post(`/api/projects/${otherProjectId}/issues`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Other Issue 2', projectId: otherProjectId });

            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/issues/${otherIssueRes.body._id}/tasks`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Issue non trouvée ou n\'appartient pas au projet.');
        });

        test('should return only assigned tasks for non-owner non-admin members', async () => {
            await Task.create({ title: 'Assigned Issue Task', project: projectId, createdBy: ownerId, issueId, assignee: memberId, status: 'todo' });
            await Task.create({ title: 'Unassigned Issue Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .get(`/api/tasks/projects/${projectId}/issues/${issueId}/tasks`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Assigned Issue Task');
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

        test('should return 400 for invalid projectId', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/invalid-id/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 400 for invalid taskId', async () => {
            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/invalid-id`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 404 for non-existent project', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });
            const fakeProjectId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .put(`/api/tasks/projects/${fakeProjectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Projet non trouvé.');
        });

        test('should return 404 for non-existent task', async () => {
            const fakeTaskId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${fakeTaskId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Tâche non trouvée.');
        });

        test('should return 404 for issue not found', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });
            // Delete the issue
            await request(app)
                .delete(`/api/projects/${projectId}/issues/${issueId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Issue associée non trouvée.');
        });

        test('should return 400 for closed issue', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId: closedIssueId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Impossible de modifier une tâche liée à une issue fermée.');
        });

        test('should return 403 for non-admin, non-owner, non-assignee user', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ title: 'Updated Title' });

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Accès refusé. Seuls le propriétaire ou l\'assigné peuvent modifier cette tâche.');
        });

        test('should allow assignee to update task', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, assignee: memberId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ title: 'Updated by Assignee' });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Updated by Assignee');
        });

        test('should return 400 for invalid status', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ status: 'invalid_status' });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Statut invalide.');
        });

        test('should update status to valid values', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ status: 'in_progress' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('in_progress');
        });

        test('should update assignee', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ assignee: memberId });

            expect(res.statusCode).toBe(200);
            expect(res.body.assignee._id).toBe(memberId);
        });

        test('should set assignee to null', async () => {
            const task = await Task.create({ title: 'Update Task', project: projectId, createdBy: ownerId, issueId, assignee: memberId, status: 'todo' });

            const res = await request(app)
                .put(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ assignee: null });

            expect(res.statusCode).toBe(200);
            expect(res.body.assignee).toBeNull();
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

        test('should return 400 for invalid projectId', async () => {
            const task = await Task.create({ title: 'Delete Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .delete(`/api/tasks/projects/invalid-id/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 400 for invalid taskId', async () => {
            const res = await request(app)
                .delete(`/api/tasks/projects/${projectId}/tasks/invalid-id`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('ID non valide.');
        });

        test('should return 404 for non-existent project', async () => {
            const task = await Task.create({ title: 'Delete Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });
            const fakeProjectId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .delete(`/api/tasks/projects/${fakeProjectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Projet non trouvé.');
        });

        test('should return 403 for non-owner non-admin user', async () => {
            const task = await Task.create({ title: 'Delete Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });

            const res = await request(app)
                .delete(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Accès refusé. Seuls les propriétaires peuvent supprimer des tâches.');
        });

        test('should return 404 for non-existent task', async () => {
            const fakeTaskId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .delete(`/api/tasks/projects/${projectId}/tasks/${fakeTaskId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Tâche non trouvée.');
        });

        test('should return 404 for issue not found', async () => {
            const task = await Task.create({ title: 'Delete Task', project: projectId, createdBy: ownerId, issueId, status: 'todo' });
            // Delete the issue
            await request(app)
                .delete(`/api/projects/${projectId}/issues/${issueId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            const res = await request(app)
                .delete(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Issue associée non trouvée.');
        });

        test('should return 400 for closed issue', async () => {
            const task = await Task.create({ title: 'Delete Task', project: projectId, createdBy: ownerId, issueId: closedIssueId, status: 'todo' });

            const res = await request(app)
                .delete(`/api/tasks/projects/${projectId}/tasks/${task._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Impossible de supprimer une tâche liée à une issue fermée.');
        });
    });
});
