import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPaymentController,
  getPaymentsByInvoiceController,
  updatePaymentController,
  deletePaymentController,
} from '../controllers/paymentController';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createPaymentController);
router.get('/invoice/:invoiceId', getPaymentsByInvoiceController);
router.patch('/:id', updatePaymentController);
router.delete('/:id', deletePaymentController);

export default router;

