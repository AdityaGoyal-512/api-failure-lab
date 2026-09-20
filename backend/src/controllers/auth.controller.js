import { createAuthService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export function createAuthController(authService = createAuthService()) {
  return {
    register: asyncHandler(async (request, response) => response.status(201).json({ user: await authService.register(request.body) })),
    login: asyncHandler(async (request, response) => response.status(200).json(await authService.login(request.body))),
    me: asyncHandler(async (request, response) => response.status(200).json({ user: await authService.getCurrentUser(request.auth.userId) })),
  };
}
