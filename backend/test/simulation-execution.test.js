import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import test from 'node:test';
import express from 'express';
import { createSimulationExecutionRouter } from '../src/routes/simulation-execution.routes.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error.middleware.js';

const simulationId = '507f1f77bcf86cd799439011';
const baseSimulation = {
  _id: simulationId,
  method: 'POST', path: '/payment', latencyMs: 0, failureRate: 0, failureStatusCode: 500,
  successResponse: { success: true }, failureResponse: { error: 'Payment service unavailable' },
};
let currentSimulation = { ...baseSimulation };

const simulationService = {
  async getSimulationForExecution(id) {
    if (id !== simulationId || !currentSimulation) {
      const error = new Error('Simulation not found.'); error.statusCode = 404; throw error;
    }
    return currentSimulation;
  },
};

let server;
let baseUrl;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/sim/:simulationId', createSimulationExecutionRouter({ simulationService }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/sim`;
});

test.after(() => server.close());

async function request(id = simulationId, path = '/payment', method = 'POST') {
  const response = await fetch(`${baseUrl}/${id}${path}`, { method });
  return { status: response.status, body: await response.json() };
}

test('simulation execution engine', async (t) => {
  await t.test('existing simulation executes successfully with the correct method', async () => {
    currentSimulation = { ...baseSimulation, failureRate: 0, latencyMs: 0 };
    const result = await request();
    assert.equal(result.status, 200); assert.deepEqual(result.body, { success: true });
  });
  await t.test('wrong HTTP method returns 405', async () => assert.equal((await request(simulationId, '/payment', 'GET')).status, 405));
  await t.test('wrong simulation path returns 404', async () => assert.equal((await request(simulationId, '/orders')).status, 404));
  await t.test('unknown simulation ID returns 404', async () => assert.equal((await request('507f1f77bcf86cd799439012')).status, 404));
  await t.test('failure rate of zero always returns success', async () => {
    currentSimulation = { ...baseSimulation, failureRate: 0 };
    assert.equal((await request()).status, 200);
  });
  await t.test('failure rate of 100 returns configured failure response', async () => {
    currentSimulation = { ...baseSimulation, failureRate: 100, failureStatusCode: 503 };
    const result = await request();
    assert.equal(result.status, 503); assert.deepEqual(result.body, baseSimulation.failureResponse);
  });
  await t.test('zero latency has no meaningful artificial delay', async () => {
    currentSimulation = { ...baseSimulation, latencyMs: 0, failureRate: 0 };
    const started = performance.now(); await request();
    assert.ok(performance.now() - started < 100);
  });
  await t.test('configured non-zero latency is applied asynchronously', async () => {
    currentSimulation = { ...baseSimulation, latencyMs: 30, failureRate: 0 };
    const started = performance.now(); const result = await request();
    assert.equal(result.status, 200); assert.ok(performance.now() - started >= 20);
  });
});
