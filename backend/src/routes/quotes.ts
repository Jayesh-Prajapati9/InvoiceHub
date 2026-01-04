import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getQuotes,
  getQuoteById,
  createQuoteController,
  updateQuote,
  updateQuoteStatusController,
  deleteQuote,
  sendQuoteEmail,
  getRenderedQuoteTemplate,
} from '../controllers/quoteController';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getQuotes);
router.get('/:id/render', getRenderedQuoteTemplate);
router.get('/:id', getQuoteById);
router.post('/', createQuoteController);
router.put('/:id', updateQuote);
router.patch('/:id/status', updateQuoteStatusController);
router.post('/:id/send-email', sendQuoteEmail);
router.delete('/:id', deleteQuote);

export default router;

