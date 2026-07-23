import { z } from 'zod';
import { AuditAction } from '@prisma/client';

export const listUsersQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().trim().optional(),
  }),
  params: z.object({}).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>['query'];

export const listAuditLogsQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    action: z.nativeEnum(AuditAction).optional(),
  }),
  params: z.object({}).optional(),
});
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>['query'];

export const userStatusParamSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid user id'),
  }),
});

export const feedbackIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid feedback id'),
  }),
});

export const upsertFeatureFlagSchema = z.object({
  body: z.object({
    key: z.string().trim().min(1).max(100),
    enabled: z.boolean(),
    description: z.string().trim().max(500).optional(),
    rolloutPercentage: z.number().int().min(0).max(100).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(10000),
    isPublished: z.boolean().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
