import { Router } from 'express';
import authRoutes from './auth.routes';
import journalRoutes from './journal.routes';
import moodRoutes from './mood.routes';
import chatRoutes from './chat.routes';
import reportRoutes from './report.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import gratitudeRoutes from './gratitude.routes';
import manifestationRoutes from './manifestation.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK', data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/journal', journalRoutes);
router.use('/mood', moodRoutes);
router.use('/ai-chat', chatRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/gratitude', gratitudeRoutes);
router.use('/manifestation', manifestationRoutes);

export default router;
