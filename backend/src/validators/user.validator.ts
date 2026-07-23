import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    theme: z.string().max(64).optional(),
    notifications: z.boolean().optional(),
    privateMode: z.boolean().optional(),
    timezone: z.string().max(64).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const submitFeedbackSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
    rating: z.number().int().min(1).max(5).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required to confirm account deletion'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
