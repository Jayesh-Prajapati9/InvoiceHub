import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;

