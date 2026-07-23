import { z } from 'zod';

export const createChatSessionSchema = z.object({
  body: z.object({
    title: z.string().trim().max(200).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const sendChatMessageSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, 'Message cannot be empty').max(4000),
  }),
  query: z.object({}).optional(),
  params: z.object({
    sessionId: z.string().uuid('Invalid session id'),
  }),
});

export const sessionIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    sessionId: z.string().uuid('Invalid session id'),
  }),
});
