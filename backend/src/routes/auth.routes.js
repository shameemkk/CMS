import express from 'express';
import {
  adminLogin,
  register,
  login,
  changePassword,
  getMe,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { statusMiddleware } from '../middlewares/status.middleware.js';

const router = express.Router();

// Public routes
router.post('/admin/login', adminLogin);
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, statusMiddleware, getMe);
router.put('/change-password', authMiddleware, statusMiddleware, changePassword);

export default router;


