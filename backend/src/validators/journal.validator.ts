import { z } from 'zod';

export const MoodEnum = z.enum(['EXCELLENT', 'GREAT', 'GOOD', 'OKAY', 'SAD', 'ANXIOUS']);

export const createJournalEntrySchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    content: z.string().trim().min(1, 'Content is required').max(20000),
    mood: MoodEnum,
    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional().default([]),
    emotions: z.array(z.string().trim().min(1).max(50)).max(20).optional().default([]),
    entryType: z.enum(['TEXT', 'VOICE']).optional().default('TEXT'),
    audioUrl: z.string().url().optional(),
    audioDurationSeconds: z.coerce.number().int().positive().optional(),
    requestAiReflection: z.coerce.boolean().optional().default(false),
    createdAt: z.coerce.date().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateJournalEntrySchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(20000).optional(),
    mood: MoodEnum.optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    emotions: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    isFavorite: z.boolean().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid entry id'),
  }),
});

export const entryIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid entry id'),
  }),
});

export const listJournalEntriesSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().trim().optional(),
    mood: MoodEnum.optional(),
    tag: z.string().trim().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    favoriteOnly: z.coerce.boolean().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
  params: z.object({}).optional(),
});

export type ListJournalEntriesQuery = z.infer<typeof listJournalEntriesSchema>['query'];
