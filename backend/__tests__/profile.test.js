require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model.js');
const Project = require('../src/models/Project.model.js');
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
});

describe('Profile API', () => {
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

        // Add dev as member
        await Project.findByIdAndUpdate(projectId, {
            $push: { members: { user: devLogin.body.user.id, role: 'developer' } }
        });
    });

    test('User can get their profile successfully', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.name).toBe('Owner');
        expect(res.body.user.email).toBe('owner@mail.com');
        expect(res.body.user.role).toBe('owner');
        expect(Array.isArray(res.body.projects)).toBe(true);
        expect(res.body.projects.length).toBe(1);
        expect(res.body.projects[0].name).toBe('Test Project');
        expect(res.body.projects[0].role).toBe('owner');
    });

    test('Dev can get their profile with member projects', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${devToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.name).toBe('Dev');
        expect(res.body.projects.length).toBe(1);
        expect(res.body.projects[0].role).toBe('developer');
    });

    test('Getting profile without authentication returns 401', async () => {
        const res = await request(app)
            .get('/api/profile');

        expect(res.statusCode).toBe(401);
    });

    test('User can update their name successfully', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'Updated Owner' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Profil mis à jour avec succès.');
        expect(res.body.user.name).toBe('Updated Owner');
    });

    test('User can update password with correct current password', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                currentPassword: '12345678',
                newPassword: 'newpassword123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Profil mis à jour avec succès.');

        // Verify new password works
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'owner@mail.com', password: 'newpassword123' });
        expect(loginRes.statusCode).toBe(200);
    });

    test('Updating password without current password returns 400', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ newPassword: 'newpassword123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Mot de passe actuel requis pour changer le mot de passe.');
    });

    test('Updating password with incorrect current password returns 400', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                currentPassword: 'wrongpassword',
                newPassword: 'newpassword123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Mot de passe actuel incorrect.');
    });

    test('Updating password with too short new password returns 400', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                currentPassword: '12345678',
                newPassword: '123'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Le nouveau mot de passe doit contenir au moins 8 caractères.');
    });

    test('Updating profile without authentication returns 401', async () => {
        const res = await request(app)
            .put('/api/profile')
            .send({ name: 'New Name' });

        expect(res.statusCode).toBe(401);
    });
});
