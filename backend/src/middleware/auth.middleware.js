import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { createHttpError } from '../utils/http-error.js';

export function createAuthenticate(authConfig = config) {
  return (request, _response, next) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return next(createHttpError(401, 'Authentication required.'));
    if (!authConfig.jwtSecret) return next(createHttpError(500, 'Authentication is not configured.'));
    try {
      request.auth = { userId: jwt.verify(authorization.slice(7), authConfig.jwtSecret).sub };
      return next();
    } catch {
      return next(createHttpError(401, 'Invalid or expired authentication token.'));
    }
  };
}
