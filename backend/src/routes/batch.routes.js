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

// Public route for fetching batches (e.g., for registration)
router.get('/', getAllBatches);

// Protect all other routes
router.use(authMiddleware);

// Admin only routes
router.post('/', adminMiddleware, createBatch);
router.get('/:id', getBatchById);
router.put('/:id', adminMiddleware, updateBatch);
router.delete('/:id', adminMiddleware, deleteBatch);

export default router;
