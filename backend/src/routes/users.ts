import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
} from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Roles endpoint (accessible to all authenticated users)
router.get('/roles', getRoles);

// User management (Admin only)
router.get('/', requireRole('ADMIN'), getUsers);
router.get('/:id', requireRole('ADMIN'), getUserById);
router.post('/', requireRole('ADMIN'), createUser);
router.put('/:id', requireRole('ADMIN'), updateUser);
router.delete('/:id', requireRole('ADMIN'), deleteUser);

export default router;

