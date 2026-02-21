import { Router } from 'express';
import {
  generateTimetable,
  getTimetable,
  getAllTimetables,
  updateTimetableStatus,
  deleteTimetable,
  getTeacherTimetable,
  updateTimetable
} from '../controllers/timetable.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/roleAuth.middleware.js';

const router = Router();

// Apply authentication to all routes
router.use(verifyJWT);

// Generate timetable (HOD/Admin only)
router.post('/generate', authorizeRoles('hod', 'admin'), generateTimetable);

// Get all timetables (HOD/Admin only)
router.get('/', authorizeRoles('hod', 'admin'), getAllTimetables);

// Get teacher's personal timetable (MUST come before /:department/:semester)
router.get('/teacher/my-schedule', authorizeRoles('teacher'), getTeacherTimetable);

// Get specific teacher's timetable (HOD/Admin only)
router.get('/teacher/:teacherId', authorizeRoles('hod', 'admin'), getTeacherTimetable);

// Get specific timetable by department and semester
router.get('/:department/:semester', getTimetable);

// Update timetable status (HOD/Admin only)
router.patch('/:id/status', authorizeRoles('hod', 'admin'), updateTimetableStatus);

// Update timetable (HOD/Admin only)
router.put('/:id', authorizeRoles('hod', 'admin'), updateTimetable);

// Delete timetable (HOD/Admin only)
router.delete('/:id', authorizeRoles('hod', 'admin'), deleteTimetable);

export default router;