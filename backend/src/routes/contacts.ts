import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getContactFinancialSummary,
  getContactIncomeExpense,
} from '../controllers/contactController';
import {
  getContactPersons,
  getContactPersonById,
  createContactPerson,
  updateContactPerson,
  deleteContactPerson,
} from '../controllers/contactPersonController';
import {
  getContactActivityLogs,
  createActivityLog,
} from '../controllers/activityLogController';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// Contact routes
router.get('/', getContacts);
router.post('/', createContact);

// Financial routes (must come before /:id to avoid route conflicts)
router.get('/:id/financial-summary', getContactFinancialSummary);
router.get('/:id/income-expense', getContactIncomeExpense);

// Contact person routes (must come before /:id to avoid route conflicts)
router.get('/:contactId/persons', getContactPersons);
router.get('/:contactId/persons/:personId', getContactPersonById);
router.post('/:contactId/persons', createContactPerson);
router.put('/:contactId/persons/:personId', updateContactPerson);
router.delete('/:contactId/persons/:personId', deleteContactPerson);

// Activity log routes (must come before /:id to avoid route conflicts)
router.get('/:contactId/activities', getContactActivityLogs);
router.post('/:contactId/activities', createActivityLog);

// Generic contact routes (must come last)
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;

