import { Router } from 'express';
import authRouter from './auth.routes.js';
import healthRouter from './health.routes.js';
import simulationRouter from './simulation.routes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/simulations', simulationRouter);

export default router;
