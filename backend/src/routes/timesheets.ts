import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  deleteTimesheet,
  getBillableHours,
} from '../controllers/timesheetController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getTimesheets);
router.get('/:id', getTimesheetById);
router.get('/project/:projectId/billable', getBillableHours);
router.post('/', createTimesheet);
router.put('/:id', updateTimesheet);
router.delete('/:id', deleteTimesheet);

export default router;

