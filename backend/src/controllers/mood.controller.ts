import { Request, Response } from 'express';
import { moodService } from '../services/mood.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { MoodHistoryQuery } from '../validators/mood.validator';

export const moodController = {
  log: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await moodService.logMood(req.user.id, req.body);
    sendSuccess(res, 201, 'Mood logged', { entry });
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const history = await moodService.getHistory(req.user.id, req.query as unknown as MoodHistoryQuery);
    sendSuccess(res, 200, 'Mood history fetched', { history });
  }),
};
