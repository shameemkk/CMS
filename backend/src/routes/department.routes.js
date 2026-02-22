import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    createDepartment,
    getDepartments,
    getDepartment,
    updateDepartment,
    deleteDepartment,
} from '../controllers/department.controller.js';

const router = express.Router();

// Public route for fetching departments (e.g., for registration)
router.get('/', getDepartments);

// Protect all other routes
router.use(authMiddleware);

router.post('/', createDepartment);

router.route('/:id')
    .get(getDepartment)
    .put(updateDepartment)
    .delete(deleteDepartment);

export default router;
