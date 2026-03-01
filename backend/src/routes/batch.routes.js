import express from 'express';
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  assignBatchTutor,
  deleteBatch,
} from '../controllers/batch.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import { authorizeRoles } from '../middlewares/roleAuth.middleware.js';

const router = express.Router();

// Public route for fetching batches (e.g., for registration)
router.get('/', getAllBatches);

// Protect all other routes
router.use(authMiddleware);

// Admin and HOD routes
router.post('/', authorizeRoles('admin', 'hod'), createBatch);
router.get('/:id', getBatchById);
router.put('/:id', authorizeRoles('admin', 'hod'), updateBatch);
router.patch('/:id/tutor', authorizeRoles('admin', 'hod'), assignBatchTutor);

// Admin only routes
router.delete('/:id', adminMiddleware, deleteBatch);

export default router;
