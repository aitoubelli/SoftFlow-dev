require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
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
});

describe('Users API', () => {
    let adminToken, userToken;
    let adminId, userId;

    beforeEach(async () => {
        // Create admin
        const adminRes = await request(app).post('/api/auth/register').send({ username: 'admin', email: 'admin@test.com', password: 'password' });
        adminId = adminRes.body._id;
        await User.findByIdAndUpdate(adminId, { role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password' });
        adminToken = adminLogin.body.token;

        // Create user
        const userRes = await request(app).post('/api/auth/register').send({ username: 'user', email: 'user@test.com', password: 'password' });
        userId = userRes.body._id;
        const userLogin = await request(app).post('/api/auth/login').send({ email: 'user@test.com', password: 'password' });
        userToken = userLogin.body.token;
    });

    describe('GET /api/users', () => {
        test('should list all users for admin', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(2);
        });

        test('should fail for non-admin', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe('PUT /api/users/:id/role', () => {
        test('should update user role for admin', async () => {
            const res = await request(app)
                .put(`/api/users/${userId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'admin' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.role).toBe('admin');
        });

        test('should fail for non-admin', async () => {
            const res = await request(app)
                .put(`/api/users/${userId}/role`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ role: 'admin' });

            expect(res.statusCode).toBe(403);
        });
    });
});
