import { Router } from 'express';
import { gratitudeController } from '../controllers/gratitude.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createGratitudeEntrySchema } from '../validators/gratitude.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createGratitudeEntrySchema), gratitudeController.log);
router.get('/today', gratitudeController.getToday);
router.get('/history', gratitudeController.getHistory);
router.get('/random', gratitudeController.getRandom);

export default router;
