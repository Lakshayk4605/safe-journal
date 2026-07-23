import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ListAuditLogsQuery, ListUsersQuery } from '../validators/admin.validator';
import { PaginationQuery } from '../validators/common.validator';

export const adminController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, 200, 'Dashboard stats fetched', stats);
  }),

  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.listUsers(req.query as unknown as ListUsersQuery);
    sendSuccess(res, 200, 'Users fetched', result.items, result.meta);
  }),

  setUserActiveStatus: asyncHandler(async (req: Request, res: Response) => {
    const user = await adminService.setUserActiveStatus(req.user!.id, req.params.id, req.body.isActive);
    sendSuccess(res, 200, 'User status updated', { user });
  }),

  listFeedback: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.listFeedback(req.query as unknown as PaginationQuery);
    sendSuccess(res, 200, 'Feedback fetched', result.items, result.meta);
  }),

  resolveFeedback: asyncHandler(async (req: Request, res: Response) => {
    const feedback = await adminService.resolveFeedback(req.params.id);
    sendSuccess(res, 200, 'Feedback resolved', { feedback });
  }),

  listAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const [items, totalItems] = await adminService.listAuditLogs(req.query as unknown as ListAuditLogsQuery);
    sendSuccess(res, 200, 'Audit logs fetched', items, { totalItems });
  }),

  listFeatureFlags: asyncHandler(async (_req: Request, res: Response) => {
    const flags = await adminService.listFeatureFlags();
    sendSuccess(res, 200, 'Feature flags fetched', { flags });
  }),

  upsertFeatureFlag: asyncHandler(async (req: Request, res: Response) => {
    const flag = await adminService.upsertFeatureFlag(
      req.body.key,
      req.body.enabled,
      req.body.description,
      req.body.rolloutPercentage,
    );
    sendSuccess(res, 200, 'Feature flag saved', { flag });
  }),

  listAnnouncements: asyncHandler(async (_req: Request, res: Response) => {
    const announcements = await adminService.listAnnouncements();
    sendSuccess(res, 200, 'Announcements fetched', { announcements });
  }),

  createAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const announcement = await adminService.createAnnouncement(req.body);
    sendSuccess(res, 201, 'Announcement created', { announcement });
  }),
};
