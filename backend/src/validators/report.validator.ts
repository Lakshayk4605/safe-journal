import { z } from 'zod';

export const reportBriefQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    range: z.enum(['week', 'month', 'all']).optional().default('month'),
  }),
  params: z.object({}).optional(),
});

export type ReportBriefQuery = z.infer<typeof reportBriefQuerySchema>['query'];
