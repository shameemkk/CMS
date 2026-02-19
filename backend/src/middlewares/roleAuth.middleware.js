import { ApiError } from '../utils/ApiError.js';

// Middleware to authorize specific roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

// Middleware to check if user owns the resource or has admin privileges
export const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const userId = req.params.userId || req.params.id;
  const isOwner = req.user._id.toString() === userId;
  const isAdmin = ['admin', 'hod'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'Access denied. You can only access your own resources or need admin privileges');
  }

  next();
};

// Middleware to check department access
export const authorizeDepartment = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const requestedDepartment = req.params.department || req.body.department;
  
  // Admin and HOD can access any department
  if (['admin', 'hod'].includes(req.user.role)) {
    return next();
  }

  // Teachers and students can only access their own department
  if (req.user.department !== requestedDepartment) {
    throw new ApiError(403, 'Access denied. You can only access resources from your department');
  }

  next();
};