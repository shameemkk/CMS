import express from 'express';
import {
  createNotification,
  getNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
} from '../controllers/notification.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

// Create notification (HOD, Admin)
router.post('/', roleMiddleware('hod', 'admin'), createNotification);

// Get notifications (all roles)
router.get('/', getNotifications);
router.get('/:id', getNotification);

// Update notification (HOD, Admin)
router.put('/:id', roleMiddleware('hod', 'admin'), updateNotification);

// Delete notification (HOD, Admin)
router.delete('/:id', roleMiddleware('hod', 'admin'), deleteNotification);

export default router;


