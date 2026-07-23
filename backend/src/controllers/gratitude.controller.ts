import { Request, Response } from 'express';
import { gratitudeService } from '../services/gratitude.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export const gratitudeController = {
  log: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await gratitudeService.logGratitude(req.user.id, req.body);
    sendSuccess(res, 201, 'Gratitude logged successfully', { entry });
  }),

  getToday: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await gratitudeService.getTodayEntry(req.user.id);
    sendSuccess(res, 200, 'Today\'s gratitude entry fetched', { entry });
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const history = await gratitudeService.getHistory(req.user.id);
    sendSuccess(res, 200, 'Gratitude history fetched', { history });
  }),

  getRandom: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const drawn = await gratitudeService.getRandomItem(req.user.id);
    sendSuccess(res, 200, 'Random gratitude memory drawn', drawn);
  }),
};
