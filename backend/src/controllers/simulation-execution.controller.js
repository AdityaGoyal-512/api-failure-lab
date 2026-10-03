import { randomInt } from 'node:crypto';
import { createSimulationService } from '../services/simulation.service.js';
import { createHttpError } from '../utils/http-error.js';
import { asyncHandler } from '../utils/async-handler.js';

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function toRequestedPath(pathSegments) {
  if (!pathSegments) return '/';
  const segments = Array.isArray(pathSegments) ? pathSegments : [pathSegments];
  return `/${segments.join('/')}`;
}

export function createSimulationExecutionController({ simulationService = createSimulationService(), delayFn = delay, randomIntFn = randomInt } = {}) {
  return asyncHandler(async (request, response) => {
    const simulation = await simulationService.getSimulationForExecution(request.params.simulationId);
    const requestedPath = toRequestedPath(request.params.executionPath);

    if (requestedPath !== simulation.path) throw createHttpError(404, 'Simulation path not found.');
    if (request.method !== simulation.method) throw createHttpError(405, 'Method not allowed for this simulation.');

    await delayFn(simulation.latencyMs);
    const shouldFail = simulation.failureRate > 0 && (simulation.failureRate === 100 || randomIntFn(100) < simulation.failureRate);

    if (shouldFail) return response.status(simulation.failureStatusCode).json(simulation.failureResponse);
    return response.status(200).json(simulation.successResponse);
  });
}
