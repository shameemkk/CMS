/**
 * Status middleware - Only approved users can access
 */
export const statusMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // Admin can always access
  if (req.userRole === 'admin') {
    return next();
  }

  // Check if user is approved
  if (req.user.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your account is pending approval.',
      status: req.user.status,
    });
  }

  next();
};


