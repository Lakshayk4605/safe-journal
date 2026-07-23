import { Queue, Worker, JobsOptions } from 'bullmq';
import { getRedisConnectionOptions } from '../config/redis';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';

export const QUEUE_NAMES = {
  JOURNAL_REMINDER: 'journal-reminder',
  STREAK_CHECK: 'streak-check',
} as const;

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

// Each Queue/Worker gets its own connection built from plain options (see
// config/redis.ts for why) rather than sharing one live client instance.
export const journalReminderQueue = new Queue(QUEUE_NAMES.JOURNAL_REMINDER, {
  connection: getRedisConnectionOptions(),
  defaultJobOptions,
});

export const streakCheckQueue = new Queue(QUEUE_NAMES.STREAK_CHECK, {
  connection: getRedisConnectionOptions(),
  defaultJobOptions,
});

/**
 * Worker: sends a gentle reminder email to users who opted into notifications
 * and haven't logged an entry today. Intended to be triggered by a daily
 * scheduled job (e.g. via queue.add with a repeat option, or an external cron).
 */
export function startJournalReminderWorker() {
  const worker = new Worker(
    QUEUE_NAMES.JOURNAL_REMINDER,
    async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const usersToRemind = await prisma.user.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          preferences: { notifications: true },
          OR: [{ lastEntryDate: null }, { lastEntryDate: { lt: startOfDay } }],
        },
        select: { id: true, name: true, email: true },
        take: 500, // batch to avoid overload; a production job would paginate
      });

      for (const user of usersToRemind) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'JOURNAL_REMINDER',
            title: 'Time to reflect',
            body: "You haven't written today's entry yet. Take a few minutes for yourself.",
          },
        });
      }

      logger.info({ count: usersToRemind.length }, 'Journal reminder job completed');
    },
    { connection: getRedisConnectionOptions() },
  );

  worker.on('error', (err) => {
    // A Worker's underlying connection failing must never crash the process —
    // log and let ioredis's retryStrategy keep attempting reconnection.
    logger.error({ err }, 'Journal reminder worker connection error');
  });

  return worker;
}

/** Resets streaks for users who missed a day, run once daily. */
export function startStreakCheckWorker() {
  const worker = new Worker(
    QUEUE_NAMES.STREAK_CHECK,
    async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const result = await prisma.user.updateMany({
        where: {
          deletedAt: null,
          streakDays: { gt: 0 },
          OR: [{ lastEntryDate: null }, { lastEntryDate: { lt: twoDaysAgo } }],
        },
        data: { streakDays: 0 },
      });

      logger.info({ count: result.count }, 'Streak reset job completed');
    },
    { connection: getRedisConnectionOptions() },
  );

  worker.on('error', (err) => {
    logger.error({ err }, 'Streak check worker connection error');
  });

  return worker;
}
