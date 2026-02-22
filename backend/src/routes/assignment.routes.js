import express from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Create assignment (Teacher, HOD, Admin)
router.post('/', roleMiddleware('teacher', 'hod', 'admin'), createAssignment);

// Get assignments (all roles)
router.get('/', getAssignments);
router.get('/:id', getAssignment);

// Update assignment (Teacher, HOD, Admin)
router.put('/:id', roleMiddleware('teacher', 'hod', 'admin'), updateAssignment);

// Delete assignment (Teacher can delete own, HOD/Admin can delete all)
router.delete('/:id', roleMiddleware('teacher', 'hod', 'admin'), deleteAssignment);

export default router;


