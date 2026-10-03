import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createSimulationRouter } from '../src/routes/simulation.routes.js';
import { createSimulationService } from '../src/services/simulation.service.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware.js';

const authConfig = { jwtSecret: 'simulation-test-secret', jwtExpiresIn: '1h' };
const simulations = [];
const ownerToken = jwt.sign({ sub: 'user-a' }, authConfig.jwtSecret);
const otherToken = jwt.sign({ sub: 'user-b' }, authConfig.jwtSecret);

function document(data) {
  const result = { ...data };
  result.toObject = () => ({ ...result });
  return result;
}

const simulationModel = {
  create: async (data) => {
    const now = new Date().toISOString();
    const simulation = document({ _id: `simulation-${simulations.length + 1}`, ...data, createdAt: now, updatedAt: now });
    simulations.push(simulation);
    return simulation;
  },
  find: ({ userId }) => ({ sort: async () => simulations.filter((simulation) => simulation.userId === userId) }),
  findOne: async ({ _id, userId }) => simulations.find((simulation) => simulation._id === _id && simulation.userId === userId),
  findOneAndUpdate: async ({ _id, userId }, update) => {
    const simulation = simulations.find((item) => item._id === _id && item.userId === userId);
    if (simulation) Object.assign(simulation, update, { updatedAt: new Date().toISOString() });
    return simulation;
  },
  findOneAndDelete: async ({ _id, userId }) => {
    const index = simulations.findIndex((simulation) => simulation._id === _id && simulation.userId === userId);
    return index === -1 ? null : simulations.splice(index, 1)[0];
  },
};

const validSimulation = {
  name: 'Payment API', method: 'POST', path: '/payment', latencyMs: 2000,
  failureRate: 20, failureStatusCode: 500,
  successResponse: { success: true }, failureResponse: { error: 'Payment service unavailable' },
};

let server;
let baseUrl;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/simulations', createSimulationRouter({ authConfig, simulationService: createSimulationService({ simulationModel }) }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/simulations`;
});

test.after(() => server.close());

async function request(path = '', { token, body, method = 'GET' } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
    ...(body && { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

test('simulation management endpoints', async (t) => {
  let simulationId;

  await t.test('unauthenticated user cannot create a simulation', async () => assert.equal((await request('', { method: 'POST', body: validSimulation })).status, 401));
  await t.test('authenticated user can create a simulation', async () => {
    const result = await request('', { token: ownerToken, method: 'POST', body: validSimulation });
    assert.equal(result.status, 201); simulationId = result.body.simulation._id;
  });
  await t.test('created simulation belongs to authenticated user', async () => assert.equal(simulations[0].userId, 'user-a'));
  await t.test('user lists only their own simulations', async () => {
    await request('', { token: otherToken, method: 'POST', body: { ...validSimulation, name: 'Other API', path: '/other' } });
    const result = await request('', { token: ownerToken });
    assert.equal(result.status, 200); assert.equal(result.body.simulations.length, 1); assert.equal(result.body.simulations[0]._id, simulationId);
  });
  await t.test('user gets their own simulation', async () => assert.equal((await request(`/${simulationId}`, { token: ownerToken })).status, 200));
  await t.test('user updates their own simulation', async () => {
    const result = await request(`/${simulationId}`, { token: ownerToken, method: 'PUT', body: { latencyMs: 3000 } });
    assert.equal(result.status, 200); assert.equal(result.body.simulation.latencyMs, 3000);
  });
  await t.test('user cannot access another user simulation', async () => assert.equal((await request(`/${simulationId}`, { token: otherToken })).status, 404));
  await t.test('user cannot update another user simulation', async () => assert.equal((await request(`/${simulationId}`, { token: otherToken, method: 'PUT', body: { name: 'Stolen' } })).status, 404));
  await t.test('user cannot delete another user simulation', async () => assert.equal((await request(`/${simulationId}`, { token: otherToken, method: 'DELETE' })).status, 404));
  await t.test('user deletes their own simulation', async () => assert.equal((await request(`/${simulationId}`, { token: ownerToken, method: 'DELETE' })).status, 204));
  await t.test('invalid method is rejected', async () => assert.equal((await request('', { token: ownerToken, method: 'POST', body: { ...validSimulation, method: 'OPTIONS' } })).status, 400));
  await t.test('invalid path is rejected', async () => assert.equal((await request('', { token: ownerToken, method: 'POST', body: { ...validSimulation, path: 'payment' } })).status, 400));
  await t.test('invalid failure rate is rejected', async () => assert.equal((await request('', { token: ownerToken, method: 'POST', body: { ...validSimulation, failureRate: 101 } })).status, 400));
  await t.test('invalid latency is rejected', async () => assert.equal((await request('', { token: ownerToken, method: 'POST', body: { ...validSimulation, latencyMs: -1 } })).status, 400));
});
