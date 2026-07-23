import { prisma } from '../config/prisma';
import { userRepository } from '../repositories/user.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { parsePagination, buildPaginatedResult } from '../utils/pagination';
import { ApiError } from '../utils/apiError';
import { AuditAction } from '@prisma/client';

export const adminService = {
  async getDashboardStats() {
    const [totalUsers, activeUsers, totalEntries, totalMoodEntries, totalChatSessions, unresolvedFeedback] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        userRepository.countActive(),
        prisma.journalEntry.count({ where: { deletedAt: null } }),
        prisma.moodEntry.count(),
        prisma.chatSession.count(),
        prisma.feedback.count({ where: { resolved: false } }),
      ]);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const [newUsersLast7Days, newEntriesLast7Days] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: last7Days }, deletedAt: null } }),
      prisma.journalEntry.count({ where: { createdAt: { gte: last7Days }, deletedAt: null } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalEntries,
      totalMoodEntries,
      totalChatSessions,
      unresolvedFeedback,
      newUsersLast7Days,
      newEntriesLast7Days,
    };
  },

  async listUsers(query: { page?: number; limit?: number; search?: string }) {
    const pagination = parsePagination(query);
    const [items, totalItems] = await userRepository.listForAdmin({ ...pagination, search: query.search });
    return buildPaginatedResult(items, totalItems, pagination);
  },

  async setUserActiveStatus(adminId: string, userId: string, isActive: boolean) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const updated = await userRepository.update(userId, { isActive });
    await auditLogRepository.log({
      userId: adminId,
      action: AuditAction.ADMIN_ACTION,
      metadata: { action: 'set_user_active_status', targetUserId: userId, isActive },
    });
    return updated;
  },

  async listFeedback(query: { page?: number; limit?: number }) {
    const pagination = parsePagination(query);
    const [items, totalItems] = await Promise.all([
      prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.feedback.count(),
    ]);
    return buildPaginatedResult(items, totalItems, pagination);
  },

  resolveFeedback(id: string) {
    return prisma.feedback.update({ where: { id }, data: { resolved: true } });
  },

  listAuditLogs(query: { page?: number; limit?: number; action?: AuditAction }) {
    const pagination = parsePagination(query);
    return auditLogRepository.listForAdmin(pagination.page, pagination.limit, query.action);
  },

  listFeatureFlags() {
    return prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  },

  upsertFeatureFlag(key: string, enabled: boolean, description?: string, rolloutPercentage?: number) {
    return prisma.featureFlag.upsert({
      where: { key },
      update: { enabled, description, rolloutPercentage },
      create: { key, enabled, description, rolloutPercentage: rolloutPercentage ?? 100 },
    });
  },

  listAnnouncements() {
    return prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  },

  createAnnouncement(data: { title: string; body: string; isPublished?: boolean }) {
    return prisma.announcement.create({
      data: { ...data, publishedAt: data.isPublished ? new Date() : null },
    });
  },
};
