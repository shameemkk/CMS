import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
router.use(statusMiddleware);

router.get('/stats', getDashboardStats);

export default router;


