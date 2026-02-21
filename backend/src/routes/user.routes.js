import express from 'express';
import {
  getProfile,
  updateProfile,
  getPendingUsers,
  getAllUsers,
  updateUserStatus,
  getUsersByRole,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  promoteStudents,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import { authorizeRoles } from '../middlewares/roleAuth.middleware.js';

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

// Teacher management routes (HOD and Admin)
router.post('/teacher', authorizeRoles('hod', 'admin'), addTeacher);
router.put('/teacher/:id', authorizeRoles('hod', 'admin'), updateTeacher);
router.delete('/teacher/:id', authorizeRoles('hod', 'admin'), deleteTeacher);

// Student promotion route (HOD and Admin)
router.post('/promote-students', authorizeRoles('hod', 'admin'), promoteStudents);

export default router;


