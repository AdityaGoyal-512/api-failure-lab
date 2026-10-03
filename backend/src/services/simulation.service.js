import Simulation from '../models/simulation.model.js';
import mongoose from 'mongoose';
import { createHttpError } from '../utils/http-error.js';

const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const editableFields = ['name', 'method', 'path', 'latencyMs', 'failureRate', 'failureStatusCode', 'successResponse', 'failureResponse'];

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateSimulation(input, { partial = false } = {}) {
  const data = {};
  for (const field of editableFields) if (field in input) data[field] = input[field];

  if (!partial && editableFields.some((field) => !(field in data))) {
    throw createHttpError(400, 'All simulation fields are required.');
  }
  if ('name' in data && !String(data.name || '').trim()) throw createHttpError(400, 'Name is required.');
  if ('method' in data) {
    data.method = String(data.method).toUpperCase();
    if (!methods.has(data.method)) throw createHttpError(400, 'Unsupported HTTP method.');
  }
  if ('path' in data && (!String(data.path).trim() || !String(data.path).trim().startsWith('/'))) throw createHttpError(400, 'Path must start with "/".');
  if ('latencyMs' in data && (!Number.isFinite(data.latencyMs) || data.latencyMs < 0)) throw createHttpError(400, 'Latency must be zero or greater.');
  if ('failureRate' in data && (!Number.isFinite(data.failureRate) || data.failureRate < 0 || data.failureRate > 100)) throw createHttpError(400, 'Failure rate must be between 0 and 100.');
  if ('failureStatusCode' in data && (!Number.isInteger(data.failureStatusCode) || data.failureStatusCode < 100 || data.failureStatusCode > 599)) throw createHttpError(400, 'Failure status code must be between 100 and 599.');
  if ('successResponse' in data && !isObject(data.successResponse)) throw createHttpError(400, 'Success response must be a JSON object.');
  if ('failureResponse' in data && !isObject(data.failureResponse)) throw createHttpError(400, 'Failure response must be a JSON object.');

  if ('name' in data) data.name = data.name.trim();
  if ('path' in data) data.path = data.path.trim();
  return data;
}

export function createSimulationService({ simulationModel = Simulation } = {}) {
  return {
    async createSimulation(userId, input) {
      return simulationModel.create({ userId, ...validateSimulation(input) });
    },
    async getUserSimulations(userId) {
      return simulationModel.find({ userId }).sort({ createdAt: -1 });
    },
    async getSimulationById(userId, simulationId) {
      const simulation = await simulationModel.findOne({ _id: simulationId, userId });
      if (!simulation) throw createHttpError(404, 'Simulation not found.');
      return simulation;
    },
    async getSimulationForExecution(simulationId) {
      if (!mongoose.isValidObjectId(simulationId)) throw createHttpError(404, 'Simulation not found.');
      const simulation = await simulationModel.findById(simulationId);
      if (!simulation) throw createHttpError(404, 'Simulation not found.');
      return simulation;
    },
    async updateSimulation(userId, simulationId, input) {
      const update = validateSimulation(input, { partial: true });
      if (!Object.keys(update).length) throw createHttpError(400, 'Provide at least one simulation field to update.');
      const simulation = await simulationModel.findOneAndUpdate({ _id: simulationId, userId }, update, { new: true, runValidators: true });
      if (!simulation) throw createHttpError(404, 'Simulation not found.');
      return simulation;
    },
    async deleteSimulation(userId, simulationId) {
      const simulation = await simulationModel.findOneAndDelete({ _id: simulationId, userId });
      if (!simulation) throw createHttpError(404, 'Simulation not found.');
    },
  };
}

export { validateSimulation };
