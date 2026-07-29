import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { reportBriefQuerySchema } from '../validators/report.validator';

const router = Router();

router.use(requireAuth);
router.get('/summary', reportController.summary);
router.get('/brief', validate(reportBriefQuerySchema), reportController.brief);

export default router;
