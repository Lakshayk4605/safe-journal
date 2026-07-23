import { z } from 'zod';
import { MoodEnum } from './journal.validator';

export const createMoodEntrySchema = z.object({
  body: z.object({
    mood: MoodEnum,
    notes: z.string().trim().max(1000).optional(),
    date: z.coerce.date().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const moodHistoryQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    range: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().default('month'),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
  params: z.object({}).optional(),
});

export type MoodHistoryQuery = z.infer<typeof moodHistoryQuerySchema>['query'];
