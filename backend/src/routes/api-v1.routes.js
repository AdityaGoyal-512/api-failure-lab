import { Router } from 'express';
import authRouter from './auth.routes.js';
import healthRouter from './health.routes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);

export default router;
