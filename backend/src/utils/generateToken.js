import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generate JWT token
 * @param {Object} payload - Token payload (userId, role, department, status)
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};


