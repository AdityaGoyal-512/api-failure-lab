import { Router } from 'express';
import { createSimulationController } from '../controllers/simulation.controller.js';
import { createAuthenticate } from '../middleware/auth.middleware.js';

export function createSimulationRouter({ simulationService, authConfig } = {}) {
  const router = Router();
  const controller = createSimulationController(simulationService);
  router.use(createAuthenticate(authConfig));
  router.route('/').post(controller.create).get(controller.list);
  router.route('/:id').get(controller.getById).put(controller.update).delete(controller.remove);
  return router;
}

export default createSimulationRouter();
