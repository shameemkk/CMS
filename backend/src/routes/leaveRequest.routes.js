import express from 'express';
import {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  updateLeaveRequestStatus,
  deleteLeaveRequest,
} from '../controllers/leaveRequest.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Create leave request (all roles)
router.post('/', createLeaveRequest);

// Get leave requests (all roles - filtered by permissions)
router.get('/', getLeaveRequests);
router.get('/:id', getLeaveRequest);

// Update leave request status (HOD for teachers, Admin for all)
router.put('/:id/status', roleMiddleware('hod', 'admin'), updateLeaveRequestStatus);

// Delete leave request (own requests or Admin)
router.delete('/:id', deleteLeaveRequest);

export default router;


