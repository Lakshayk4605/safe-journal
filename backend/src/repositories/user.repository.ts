import { Prisma, User } from '@prisma/client';
import { prisma } from '../config/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null }, include: { preferences: true } });
  },

  findByIdWithPassword(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  },

  findByEmailVerificationToken(token: string) {
    return prisma.user.findUnique({ where: { emailVerificationToken: token } });
  },

  findByPasswordResetToken(token: string) {
    return prisma.user.findUnique({ where: { passwordResetToken: token } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, email: `deleted_${id}@deleted.safejournal.app` },
    });
  },

  incrementEntryStats(id: string, entryDate: Date) {
    return prisma.user.update({
      where: { id },
      data: {
        totalEntries: { increment: 1 },
        lastEntryDate: entryDate,
      },
    });
  },

  upsertPreferences(
    userId: string,
    data: { theme?: string; notifications?: boolean; privateMode?: boolean; timezone?: string },
  ) {
    return prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: { ...data, userId },
    });
  },

  countActive() {
    return prisma.user.count({ where: { deletedAt: null, isActive: true } });
  },

  listForAdmin({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
        : {}),
    };
    return Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          totalEntries: true,
          streakDays: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
  },
};

export type { User };
