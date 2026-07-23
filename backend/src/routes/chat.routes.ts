import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { aiRateLimiter } from '../middlewares/rateLimiter.middleware';
import { createChatSessionSchema, sendChatMessageSchema, sessionIdParamSchema } from '../validators/chat.validator';
import { paginationQuerySchema } from '../validators/common.validator';

const router = Router();

router.use(requireAuth);

router.post('/sessions', validate(createChatSessionSchema), chatController.createSession);
router.get('/sessions', validate(paginationQuerySchema), chatController.listSessions);
router.get('/sessions/:sessionId', validate(sessionIdParamSchema), chatController.getSession);
router.post('/sessions/:sessionId/archive', validate(sessionIdParamSchema), chatController.archiveSession);
router.patch('/sessions/:sessionId', validate(sessionIdParamSchema), chatController.updateSession);
router.delete('/sessions/:sessionId', validate(sessionIdParamSchema), chatController.deleteSession);
router.post(
  '/sessions/:sessionId/messages',
  aiRateLimiter,
  validate(sendChatMessageSchema),
  chatController.sendMessage,
);

export default router;
