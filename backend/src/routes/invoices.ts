import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getInvoices,
  getInvoiceById,
  createInvoiceController,
  createInvoiceFromQuote,
  getQuoteForInvoice,
  updateInvoice,
  updateInvoiceStatusController,
  deleteInvoice,
  addProjectHoursToInvoice,
  sendInvoiceEmail,
  renderInvoiceWithTemplate,
} from '../controllers/invoiceController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getInvoices);
router.get('/from-quote/:id', getQuoteForInvoice);
router.get('/:id/render', renderInvoiceWithTemplate);
router.get('/:id', getInvoiceById);
router.post('/', createInvoiceController);
router.post('/from-quote/:id', createInvoiceFromQuote);
router.post('/add-project-hours', addProjectHoursToInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatusController);
router.post('/:id/send-email', sendInvoiceEmail);
router.delete('/:id', deleteInvoice);

export default router;

