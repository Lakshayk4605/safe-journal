import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationQuerySchema } from '../validators/common.validator';
import {
  createAnnouncementSchema,
  feedbackIdParamSchema,
  listAuditLogsQuerySchema,
  listUsersQuerySchema,
  upsertFeatureFlagSchema,
  userStatusParamSchema,
} from '../validators/admin.validator';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', adminController.dashboard);

router.get('/users', validate(listUsersQuerySchema), adminController.listUsers);
router.patch('/users/:id/status', validate(userStatusParamSchema), adminController.setUserActiveStatus);

router.get('/feedback', validate(paginationQuerySchema), adminController.listFeedback);
router.patch('/feedback/:id/resolve', validate(feedbackIdParamSchema), adminController.resolveFeedback);

router.get('/audit-logs', validate(listAuditLogsQuerySchema), adminController.listAuditLogs);

router.get('/feature-flags', adminController.listFeatureFlags);
router.put('/feature-flags', validate(upsertFeatureFlagSchema), adminController.upsertFeatureFlag);

router.get('/announcements', adminController.listAnnouncements);
router.post('/announcements', validate(createAnnouncementSchema), adminController.createAnnouncement);

export default router;

