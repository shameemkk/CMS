import express from 'express';
import {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
} from '../controllers/exam.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Create exam (Teacher, HOD, Admin)
router.post('/', roleMiddleware('teacher', 'hod', 'admin'), createExam);

// Get exams (all roles)
router.get('/', getExams);
router.get('/:id', getExam);

// Update exam (Teacher, HOD, Admin)
router.put('/:id', roleMiddleware('teacher', 'hod', 'admin'), updateExam);

// Delete exam (HOD, Admin)
router.delete('/:id', roleMiddleware('hod', 'admin'), deleteExam);

export default router;


