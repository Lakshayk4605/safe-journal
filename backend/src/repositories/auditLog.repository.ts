import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const auditLogRepository = {
  log(data: {
    userId?: string;
    action: AuditAction;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Audit logging should never block or fail the primary request flow.
    return prisma.auditLog.create({ data }).catch(() => undefined);
  },

  listForUser(userId: string, page: number, limit: number) {
    return Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);
  },

  listForAdmin(page: number, limit: number, action?: AuditAction) {
    const where = action ? { action } : {};
    return Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
  },
};
