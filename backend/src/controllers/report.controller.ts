import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export const reportController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const summary = await reportService.getWellnessSummary(req.user.id);
    sendSuccess(res, 200, 'Wellness summary fetched', summary);
  }),

  brief: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const range = (req.query.range as 'week' | 'month' | 'all') || 'month';
    const briefData = await reportService.getWellnessReportBrief(req.user.id, range);
    sendSuccess(res, 200, 'Wellness report brief fetched', briefData);
  }),
};
