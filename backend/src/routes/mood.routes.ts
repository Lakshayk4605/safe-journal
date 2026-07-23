import { Router } from 'express';
import { moodController } from '../controllers/mood.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createMoodEntrySchema, moodHistoryQuerySchema } from '../validators/mood.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createMoodEntrySchema), moodController.log);
router.get('/history', validate(moodHistoryQuerySchema), moodController.history);

export default router;
