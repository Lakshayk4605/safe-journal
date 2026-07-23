import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import {
  deleteAccountSchema,
  submitFeedbackSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from '../validators/user.validator';

const router = Router();

router.get('/me', requireAuth, userController.getProfile);
router.patch('/me', requireAuth, validate(updateProfileSchema), userController.updateProfile);
router.patch('/me/preferences', requireAuth, validate(updatePreferencesSchema), userController.updatePreferences);
router.post('/me/avatar', requireAuth, uploadImage, userController.uploadAvatar);
router.delete('/me', requireAuth, validate(deleteAccountSchema), userController.deleteAccount);

// Feedback can be submitted by logged-in users or, optionally, anonymously.
router.post('/feedback', optionalAuth, validate(submitFeedbackSchema), userController.submitFeedback);

export default router;
