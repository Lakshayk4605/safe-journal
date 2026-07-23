import { Request, Response } from 'express';
import { journalService } from '../services/journal.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { uploadService } from '../services/upload.service';
import { ListJournalEntriesQuery } from '../validators/journal.validator';

export const journalController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await journalService.createEntry(req.user.id, req.body);
    sendSuccess(res, 201, 'Journal entry created', { entry });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await journalService.listEntries(req.user.id, req.query as unknown as ListJournalEntriesQuery);
    sendSuccess(res, 200, 'Journal entries fetched', result.items, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await journalService.getEntry(req.user.id, req.params.id);
    sendSuccess(res, 200, 'Journal entry fetched', { entry });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await journalService.updateEntry(req.user.id, req.params.id, req.body);
    sendSuccess(res, 200, 'Journal entry updated', { entry });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await journalService.deleteEntry(req.user.id, req.params.id);
    sendSuccess(res, 200, 'Journal entry deleted', null);
  }),

  generateReflection: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const entry = await journalService.generateReflectionForEntry(req.user.id, req.params.id);
    sendSuccess(res, 200, 'AI reflection generated', { entry });
  }),

  uploadVoiceAudio: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest('No audio file provided');

    const result = await uploadService.uploadBuffer(req.file.buffer, {
      folder: `safe-journal/${req.user.id}/voice`,
      resourceType: 'video', // Cloudinary treats audio under the 'video' resource type
      mimeType: req.file.mimetype,
    });

    sendSuccess(res, 201, 'Audio uploaded', { url: result.url, publicId: result.publicId });
  }),
};
