import { Router } from 'express';
import { createSimulationExecutionController } from '../controllers/simulation-execution.controller.js';

export function createSimulationExecutionRouter(options) {
  const router = Router({ mergeParams: true });
  router.all('/{*executionPath}', createSimulationExecutionController(options));
  return router;
}

export default createSimulationExecutionRouter();
