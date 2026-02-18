import express from 'express';
import {
  createTimetable,
  getTimetable,
  deleteTimetableEntry,
} from '../controllers/timetable.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Create/Update timetable (Teacher, HOD)
router.post('/', roleMiddleware('teacher', 'hod'), createTimetable);

// Get timetable (all roles)
router.get('/', getTimetable);

// Delete timetable entry (Teacher, HOD)
router.delete('/:id', roleMiddleware('teacher', 'hod'), deleteTimetableEntry);

export default router;


