import { Router } from 'express';
import {
  getAllMinorMajor,
  getMinorMajorById,
  createMinorMajor,
  updateMinorMajor,
  deleteMinorMajor,
  getMinorMajorByDepartment,
  toggleMinorMajorStatus
} from '../controllers/minorMajor.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/roleAuth.middleware.js';

const router = Router();

// Apply authentication to all routes
router.use(verifyJWT);

// All routes are admin-only
router.use(authorizeRoles('admin'));

// CRUD routes
router.get('/', getAllMinorMajor);
router.post('/', createMinorMajor);
router.get('/department/:department', getMinorMajorByDepartment);
router.get('/:id', getMinorMajorById);
router.put('/:id', updateMinorMajor);
router.delete('/:id', deleteMinorMajor);
router.patch('/:id/toggle', toggleMinorMajorStatus);

export default router;