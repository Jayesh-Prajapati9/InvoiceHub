import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getRecentActivities } from '../controllers/dashboardController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get recent activities
router.get('/recent-activities', getRecentActivities);

export default router;

