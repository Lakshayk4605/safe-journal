import { z } from 'zod';

export const createManifestationEntrySchema = z.object({
  body: z.object({
    intention: z.string({ required_error: 'Intention is required' }).trim().min(1, 'Intention cannot be empty').max(2000),
    affirmation: z.string({ required_error: 'Affirmation is required' }).trim().min(1, 'Affirmation cannot be empty').max(2000),
    visualized: z.boolean().optional().default(false),
    date: z.coerce.date().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
