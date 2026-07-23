import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { PaginationQuery } from '../validators/common.validator';

export const chatController = {
  createSession: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const session = await chatService.createSession(req.user.id, req.body.title);
    sendSuccess(res, 201, 'Chat session created', { session });
  }),

  listSessions: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await chatService.listSessions(req.user.id, req.query as unknown as PaginationQuery);
    sendSuccess(res, 200, 'Chat sessions fetched', result.items, result.meta);
  }),

  getSession: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const session = await chatService.getSession(req.user.id, req.params.sessionId);
    sendSuccess(res, 200, 'Chat session fetched', { session });
  }),

  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const message = await chatService.sendMessage(req.user.id, req.params.sessionId, req.body.message);
    sendSuccess(res, 201, 'Message sent', { message });
  }),

  archiveSession: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await chatService.archiveSession(req.user.id, req.params.sessionId);
    sendSuccess(res, 200, 'Chat session archived', null);
  }),

  updateSession: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const session = await chatService.updateSession(req.user.id, req.params.sessionId, req.body);
    sendSuccess(res, 200, 'Chat session updated', { session });
  }),

  deleteSession: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await chatService.deleteSession(req.user.id, req.params.sessionId);
    sendSuccess(res, 200, 'Chat session deleted', null);
  }),
};
