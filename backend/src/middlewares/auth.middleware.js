import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';

/**
 * Verify JWT token and attach user to request
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Handle admin token (admin doesn't exist in database)
    if (decoded.role === 'admin' && decoded.userId === 'admin') {
      req.user = {
        _id: 'admin',
        fullName: 'Admin',
        email: 'admin@cms.com',
        role: 'admin',
        department: 'all',
        status: 'approved',
      };
      req.userId = 'admin';
      req.userRole = 'admin';
      req.userDepartment = 'all';
      req.userStatus = 'approved';
      return next();
    }

    // Get user from database for regular users
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userDepartment = decoded.department;
    req.userStatus = decoded.status;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Access denied.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message,
    });
  }
};

