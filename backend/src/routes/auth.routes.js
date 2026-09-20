import { Router } from 'express';
import { createAuthController } from '../controllers/auth.controller.js';
import { createAuthenticate } from '../middleware/auth.middleware.js';

export function createAuthRouter({ authService, authConfig } = {}) {
  const router = Router();
  const controller = createAuthController(authService);
  const authenticate = createAuthenticate(authConfig);
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.get('/me', authenticate, controller.me);
  return router;
}

export default createAuthRouter();
