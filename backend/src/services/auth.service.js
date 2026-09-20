import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import config from '../config/env.js';
import { createHttpError } from '../utils/http-error.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function safeUser(user) {
  const source = user.toObject ? user.toObject() : user;
  return { id: String(source._id || source.id), name: source.name, email: source.email, createdAt: source.createdAt, updatedAt: source.updatedAt };
}

function validateRegistration({ name, email, password }) {
  if (!String(name || '').trim() || !email || !password) throw createHttpError(400, 'Name, email, and password are required.');
  if (!emailPattern.test(normalizeEmail(email))) throw createHttpError(400, 'Enter a valid email address.');
  if (String(password).length < 8) throw createHttpError(400, 'Password must be at least 8 characters.');
}

export function createAuthService({ userModel = User, authConfig = config } = {}) {
  function createToken(userId) {
    if (!authConfig.jwtSecret) throw createHttpError(500, 'Authentication is not configured.');
    return jwt.sign({ sub: String(userId) }, authConfig.jwtSecret, { expiresIn: authConfig.jwtExpiresIn });
  }

  return {
    async register(input) {
      validateRegistration(input);
      const email = normalizeEmail(input.email);
      if (await userModel.findOne({ email })) throw createHttpError(409, 'An account with this email already exists.');
      const user = await userModel.create({ name: input.name.trim(), email, password: await bcrypt.hash(input.password, 12) });
      return safeUser(user);
    },
    async login({ email, password }) {
      const user = await userModel.findOne({ email: normalizeEmail(email) }).select('+password');
      if (!user || !(await bcrypt.compare(password || '', user.password))) throw createHttpError(401, 'Invalid email or password.');
      return { token: createToken(user._id), user: safeUser(user) };
    },
    async getCurrentUser(userId) {
      const user = await userModel.findById(userId).select('-password');
      if (!user) throw createHttpError(401, 'Authentication required.');
      return safeUser(user);
    },
  };
}

export { normalizeEmail, safeUser };
