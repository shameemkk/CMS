import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.route('/')
  .get(getSubjects)
  .post(createSubject);

router.route('/:id')
  .put(updateSubject)
  .delete(deleteSubject);

export default router;