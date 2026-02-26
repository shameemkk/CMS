import express from 'express';
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
} from '../controllers/batch.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Admin only routes
router.post('/', adminMiddleware, createBatch);
router.get('/', getAllBatches);
router.get('/:id', getBatchById);
router.put('/:id', adminMiddleware, updateBatch);
router.delete('/:id', adminMiddleware, deleteBatch);

export default router;
