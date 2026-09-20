import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createAuthRouter } from '../src/routes/auth.routes.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware.js';

const authConfig = { jwtSecret: 'test-only-secret', jwtExpiresIn: '1h' };
const users = [];

function document(data) {
  return { ...data, toObject: () => ({ ...data }) };
}

function query(value) {
  const result = { select: async () => value };
  result.then = (resolve, reject) => Promise.resolve(value).then(resolve, reject);
  return result;
}

const userModel = {
  findOne: ({ email }) => query(users.find((user) => user.email === email)),
  findById: (id) => query(users.find((user) => user._id === id)),
  create: async (data) => {
    const now = new Date().toISOString();
    const user = document({ _id: String(users.length + 1), ...data, createdAt: now, updatedAt: now });
    users.push(user);
    return user;
  },
};

let server;
let baseUrl;

test.before(async () => {
  const { createAuthService } = await import('../src/services/auth.service.js');
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter({ authConfig, authService: createAuthService({ userModel, authConfig }) }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/auth`;
});

test.after(() => server.close());

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options,
  });
  return { status: response.status, body: await response.json() };
}

test('authentication endpoints', async (t) => {
  let token;

  await t.test('successful registration returns a safe user', async () => {
    const result = await request('/register', { method: 'POST', body: JSON.stringify({ name: 'Aditya', email: ' ADITYA@example.com ', password: 'password123' }) });
    assert.equal(result.status, 201);
    assert.equal(result.body.user.email, 'aditya@example.com');
    assert.equal('password' in result.body.user, false);
    assert.notEqual(users[0].password, 'password123');
  });

  await t.test('duplicate email is rejected', async () => {
    const result = await request('/register', { method: 'POST', body: JSON.stringify({ name: 'Aditya', email: 'aditya@example.com', password: 'password123' }) });
    assert.equal(result.status, 409);
  });

  await t.test('successful login returns a JWT and safe user', async () => {
    const result = await request('/login', { method: 'POST', body: JSON.stringify({ email: 'aditya@example.com', password: 'password123' }) });
    assert.equal(result.status, 200);
    assert.equal(typeof result.body.token, 'string');
    assert.equal('password' in result.body.user, false);
    token = result.body.token;
  });

  await t.test('invalid login is rejected', async () => {
    const result = await request('/login', { method: 'POST', body: JSON.stringify({ email: 'aditya@example.com', password: 'wrong-password' }) });
    assert.equal(result.status, 401);
  });

  await t.test('protected endpoint rejects a missing JWT', async () => {
    const result = await request('/me');
    assert.equal(result.status, 401);
  });

  await t.test('protected endpoint accepts a valid JWT', async () => {
    const result = await request('/me', { headers: { authorization: `Bearer ${token}` } });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.email, 'aditya@example.com');
  });

  await t.test('protected endpoint rejects an invalid JWT', async () => {
    const result = await request('/me', { headers: { authorization: 'Bearer invalid-token' } });
    assert.equal(result.status, 401);
  });
});
