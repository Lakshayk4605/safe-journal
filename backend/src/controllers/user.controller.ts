import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { uploadService } from '../services/upload.service';
import { COOKIE_NAMES } from '../constants';

export const userController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await userService.getProfile(req.user.id);
    sendSuccess(res, 200, 'Profile fetched', { profile });
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await userService.updateProfile(req.user.id, req.body);
    sendSuccess(res, 200, 'Profile updated', { profile });
  }),

  updatePreferences: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const preferences = await userService.updatePreferences(req.user.id, req.body);
    sendSuccess(res, 200, 'Preferences updated', { preferences });
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest('No image file provided');

    const result = await uploadService.uploadBuffer(req.file.buffer, {
      folder: `safe-journal/${req.user.id}/avatar`,
      resourceType: 'image',
      mimeType: req.file.mimetype,
    });

    const profile = await userService.updateProfile(req.user.id, { avatarUrl: result.url });
    sendSuccess(res, 200, 'Avatar updated', { profile });
  }),

  submitFeedback: asyncHandler(async (req: Request, res: Response) => {
    const feedback = await userService.submitFeedback(req.user?.id, req.body);
    sendSuccess(res, 201, 'Feedback submitted, thank you!', { feedback });
  }),

  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await userService.deleteAccount(req.user.id, req.body.password);
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: '/api/v1/auth' });
    sendSuccess(res, 200, 'Account deleted', null);
  }),
};
