import { config } from '../config/env.js';

/**
 * Admin-only middleware
 * Checks if user is admin based on .env credentials
 */
export const adminMiddleware = (req, res, next) => {
  try {
    // Admin authentication is done via .env credentials
    // This middleware checks if the request is from admin
    // Admin login creates a special token with role: 'admin'
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Check if user role is admin
    // Admin role is set during admin login
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Admin verification error.',
      error: error.message,
    });
  }
};


