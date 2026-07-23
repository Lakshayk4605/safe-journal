import { z } from 'zod';

export const createGratitudeEntrySchema = z.object({
  body: z.object({
    item1: z.string({ required_error: 'Item 1 is required' }).trim().min(1, 'First item cannot be empty').max(500),
    item2: z.string().trim().max(500).optional(),
    item3: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional(),
    date: z.coerce.date().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
