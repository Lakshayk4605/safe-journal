import { logger } from './config/logger';
import { startJournalReminderWorker, startStreakCheckWorker } from './jobs/queue';

// Run as a separate process from the API server: `npm run worker`
// Keeps background job processing isolated from the request-handling process
// so a slow/failing job never impacts API latency.

const reminderWorker = startJournalReminderWorker();
const streakWorker = startStreakCheckWorker();

logger.info('Background workers started: journal-reminder, streak-check');

async function shutdown() {
  logger.info('Shutting down workers...');
  await Promise.all([reminderWorker.close(), streakWorker.close()]);
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
