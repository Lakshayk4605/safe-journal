import { z } from 'zod';

export const paginationQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>['query'];
