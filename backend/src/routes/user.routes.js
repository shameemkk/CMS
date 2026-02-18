import express from 'express';
import {
  getProfile,
  updateProfile,
  getPendingUsers,
  getAllUsers,
  updateUserStatus,
  getUsersByRole,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Profile routes (all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Admin-only routes
router.get('/pending', adminMiddleware, getPendingUsers);
router.get('/', adminMiddleware, getAllUsers);
router.put('/:id/status', adminMiddleware, updateUserStatus);

// Get users by role (filtered by department for non-admins)
router.get('/by-role', getUsersByRole);

export default router;


