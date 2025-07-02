const request = require('supertest');
const { app, server } = require('./app');

describe('Sample Web App API Tests', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('Health and Info Endpoints', () => {
    test('GET / should return welcome message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Welcome to CI/CD Sample App!');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.nodeVersion).toBeDefined();
    });

    test('GET /health should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.nodeVersion).toBeDefined();
    });
  });

  describe('User Endpoints', () => {
    test('GET /users should return users array', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('POST /users should create a new user', async () => {
      const newUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`
      };

      const response = await request(app)
        .post('/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.id).toBeDefined();
    });

    test('POST /users should fail with missing data', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User' }); // Missing email

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });
  });
});
