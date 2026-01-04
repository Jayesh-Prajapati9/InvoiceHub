import { Router } from 'express';
import { register, login, getMe, updateProfile, updatePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);

export default router;

