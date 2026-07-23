import { Router } from 'express';
import { journalController } from '../controllers/journal.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadAudio } from '../middlewares/upload.middleware';
import {
  createJournalEntrySchema,
  entryIdParamSchema,
  listJournalEntriesSchema,
  updateJournalEntrySchema,
} from '../validators/journal.validator';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createJournalEntrySchema), journalController.create);
router.get('/', validate(listJournalEntriesSchema), journalController.list);
router.post('/voice/upload', uploadAudio, journalController.uploadVoiceAudio);
router.get('/:id', validate(entryIdParamSchema), journalController.getById);
router.patch('/:id', validate(updateJournalEntrySchema), journalController.update);
router.delete('/:id', validate(entryIdParamSchema), journalController.remove);
router.post('/:id/reflection', validate(entryIdParamSchema), journalController.generateReflection);

export default router;
