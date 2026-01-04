import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemTransactions,
} from '../controllers/itemController';
import { getItemActivityLogs } from '../controllers/itemActivityLogController';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// Specific routes (must come before /:id)
router.get('/:id/transactions', getItemTransactions);
router.get('/:id/activities', getItemActivityLogs);

// General routes
router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;

