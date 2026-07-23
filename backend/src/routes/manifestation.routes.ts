import { Router } from 'express';
import { manifestationController } from '../controllers/manifestation.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createManifestationEntrySchema } from '../validators/manifestation.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createManifestationEntrySchema), manifestationController.log);
router.get('/today', manifestationController.getToday);
router.get('/history', manifestationController.getHistory);

export default router;
