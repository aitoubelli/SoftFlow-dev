require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model.js');
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
  // nettoyer les utilisateurs entre les tests pour éviter les conflits
  await User.deleteMany({});
});

describe('Auth API', () => {
    test('registers new user as DEV', async () => {
    const res = await request(app)
      .post('/api/auth/register')
        .send({ username: 'test', email: 'test@mail.com', password: '12345678' });

    expect(res.statusCode).toBe(201);
    // le rôle par défaut dans le modèle est 'dev'
    expect(res.body.role).toBe('dev');
  });

  test('logs in and returns JWT', async () => {
    // créer l'utilisateur via l'endpoint pour s'assurer que le hash est appliqué
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'a', email: 'a@mail.com', password: '12345678' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@mail.com', password: '12345678' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('registering with duplicate email returns 400', async () => {
    // première inscription
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'dup', email: 'dup@mail.com', password: '12345678' });

    // seconde inscription avec le même email
    const res = await request(app)
      .post('/api/auth/register')
  .send({ username: 'dup2', email: 'dup@mail.com', password: 'abcdefg1' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('login with wrong password returns 401', async () => {
    // créer l'utilisateur via l'endpoint pour s'assurer que le hash est appliqué
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', email: 'user1@mail.com', password: 'correcthorseb' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@mail.com', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('token from login can access protected /me route', async () => {
    // créer et login
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'meuser', email: 'meuser@mail.com', password: 'mypassword' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'meuser@mail.com', password: 'mypassword' });

    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // appeler la route protégée
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.user).toBeDefined();
    expect(meRes.body.user.email).toBe('meuser@mail.com');
  });
});
