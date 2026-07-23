import { Request, Response } from 'express';
import { manifestationService } from '../services/manifestation.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export const manifestationController = {
  log: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await manifestationService.logManifestation(req.user.id, req.body);
    sendSuccess(res, 201, 'Manifestation logged successfully', { entry });
  }),

  getToday: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await manifestationService.getTodayEntry(req.user.id);
    sendSuccess(res, 200, 'Today\'s manifestation fetched', { entry });
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const history = await manifestationService.getHistory(req.user.id);
    sendSuccess(res, 200, 'Manifestation history fetched', { history });
  }),
};
