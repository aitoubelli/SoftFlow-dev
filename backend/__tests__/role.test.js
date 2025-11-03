require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const Project = require('../src/models/Project.model');
const { protect, adminOnly } = require('../src/middleware/auth.middleware');
const { MongoMemoryServer } = require('mongodb-memory-server');

// route temporaire admin-only pour les tests
app.get('/api/test/admin-only', protect, adminOnly, (req, res) => {
  res.json({ ok: true });
});

// route owner-only pour les tests
app.get('/api/test/project-owner/:projectId', protect, async (req, res) => {
  const proj = await Project.findById(req.params.projectId);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  if (proj.owner.toString() === req.user._id.toString()) return res.json({ ok: true });
  return res.status(403).json({ error: 'Accès réservé au propriétaire.' });
});

// route pour dev (owner ou dev)
app.get('/api/test/project-dev/:projectId', protect, async (req, res) => {
  const proj = await Project.findById(req.params.projectId);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  const userId = req.user._id.toString();
  if (proj.owner.toString() === userId) return res.json({ ok: true });
  const isDev = proj.members.some(m => m.user.toString() === userId && m.role === 'dev');
  if (isDev) return res.json({ ok: true });
  return res.status(403).json({ error: 'Accès réservé aux membres dev.' });
});

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
});

describe('Project role access (owner/dev)', () => {
  test('owner can access owner-only route', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ username: 'owner', email: 'owner@mail.com', password: 'ownerpass' });

    const ownerId = reg.body._id || reg.body.id || reg.body._id;
    const proj = await Project.create({ name: 'Proj1', owner: ownerId, members: [] });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@mail.com', password: 'ownerpass' });
    const token = login.body.token;

    const res = await request(app)
      .get(`/api/test/project-owner/${proj._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('dev member cannot access owner-only route', async () => {
    const regOwner = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ownerm', email: 'ownerm@mail.com', password: 'ownerpassm' });

    const regDev = await request(app)
      .post('/api/auth/register')
      .send({ username: 'devm', email: 'devm@mail.com', password: 'devpassm' });

    const proj = await Project.create({ name: 'ProjDevMember', owner: regOwner.body._id, members: [{ user: regDev.body._id, role: 'dev' }] });

    const loginDev = await request(app)
      .post('/api/auth/login')
      .send({ email: 'devm@mail.com', password: 'devpassm' });

    const token = loginDev.body.token;

    const res = await request(app)
      .get(`/api/test/project-owner/${proj._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('dev non-member cannot access owner-only route', async () => {
    const regOwner = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ownerx', email: 'ownerx@mail.com', password: 'ownerpassx' });

    const regDev = await request(app)
      .post('/api/auth/register')
      .send({ username: 'devx', email: 'devx@mail.com', password: 'devpassx' });

    const proj = await Project.create({ name: 'ProjDevNonMember', owner: regOwner.body._id, members: [] });

    const loginDev = await request(app)
      .post('/api/auth/login')
      .send({ email: 'devx@mail.com', password: 'devpassx' });

    const token = loginDev.body.token;

    const res = await request(app)
      .get(`/api/test/project-owner/${proj._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('dev member can access dev-only route', async () => {
    const regOwner = await request(app)
      .post('/api/auth/register')
      .send({ username: 'owner2', email: 'owner2@mail.com', password: 'ownerpass2' });

    const regDev = await request(app)
      .post('/api/auth/register')
      .send({ username: 'dev1', email: 'dev1@mail.com', password: 'devpass1' });

    const proj = await Project.create({ name: 'Proj2', owner: regOwner.body._id, members: [{ user: regDev.body._id, role: 'dev' }] });

    const loginDev = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev1@mail.com', password: 'devpass1' });
    const token = loginDev.body.token;

    const res = await request(app)
      .get(`/api/test/project-dev/${proj._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('non-member cannot access dev-only route', async () => {
    const regOwner = await request(app)
      .post('/api/auth/register')
      .send({ username: 'owner3', email: 'owner3@mail.com', password: 'ownerpass3' });

    const regOutsider = await request(app)
      .post('/api/auth/register')
      .send({ username: 'outsider', email: 'outsider@mail.com', password: 'outpass1' });

    const proj = await Project.create({ name: 'Proj3', owner: regOwner.body._id, members: [] });

    const loginOut = await request(app)
      .post('/api/auth/login')
      .send({ email: 'outsider@mail.com', password: 'outpass1' });

    const token = loginOut.body.token;

    const res = await request(app)
      .get(`/api/test/project-dev/${proj._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('owner can access dev-only route (implicit permission)', async () => {
    const regOwner = await request(app)
      .post('/api/auth/register')
      .send({ username: 'owner4', email: 'owner4@mail.com', password: 'ownerpass4' });

    const proj = await Project.create({ name: 'Proj4', owner: regOwner.body._id, members: [] });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner4@mail.com', password: 'ownerpass4' });

    const token = login.body.token;

    const res = await request(app)
      .get(`/api/test/project-dev/${proj._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Role based access (adminOnly)', () => {
  test('admin user can access admin-only route', async () => {
    // créé l'utilisateur via l'endpoint d'enregistrement
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ username: 'admin', email: 'admin@mail.com', password: 'strongpass' });

    // placer en admin directement dans la BD
    await User.findByIdAndUpdate(reg.body._id || reg.body.id || reg.body._id, { role: 'admin' });


    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@mail.com', password: 'strongpass' });

    expect(login.statusCode).toBe(200);
    const token = login.body.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('non-admin user is forbidden (403)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'dev', email: 'dev@mail.com', password: 'strongpass' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@mail.com', password: 'strongpass' });

    const token = login.body.token;
    expect(token).toBeDefined();

    const res = await request(app)
      .get('/api/test/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  test('no token returns 401', async () => {
    const res = await request(app)
      .get('/api/test/admin-only');

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});
