import express from 'express';
import {
  createResult,
  getResults,
  getResult,
  deleteResult,
} from '../controllers/result.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Create/Update result (Teacher, HOD, Admin)
router.post('/', roleMiddleware('teacher', 'hod', 'admin'), createResult);

// Get results (all roles)
router.get('/', getResults);
router.get('/:id', getResult);

// Delete result (HOD, Admin)
router.delete('/:id', roleMiddleware('hod', 'admin'), deleteResult);

export default router;


