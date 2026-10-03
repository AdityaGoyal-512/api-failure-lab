import { createSimulationService } from '../services/simulation.service.js';
import { asyncHandler } from '../utils/async-handler.js';

function safeSimulation(simulation) {
  const source = simulation.toObject ? simulation.toObject() : simulation;
  const { userId, __v, ...safe } = source;
  return safe;
}

export function createSimulationController(simulationService = createSimulationService()) {
  return {
    create: asyncHandler(async (request, response) => response.status(201).json({ simulation: safeSimulation(await simulationService.createSimulation(request.auth.userId, request.body)) })),
    list: asyncHandler(async (request, response) => response.status(200).json({ simulations: (await simulationService.getUserSimulations(request.auth.userId)).map(safeSimulation) })),
    getById: asyncHandler(async (request, response) => response.status(200).json({ simulation: safeSimulation(await simulationService.getSimulationById(request.auth.userId, request.params.id)) })),
    update: asyncHandler(async (request, response) => response.status(200).json({ simulation: safeSimulation(await simulationService.updateSimulation(request.auth.userId, request.params.id, request.body)) })),
    remove: asyncHandler(async (request, response) => { await simulationService.deleteSimulation(request.auth.userId, request.params.id); response.status(204).send(); }),
  };
}
