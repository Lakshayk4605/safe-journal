import { AuditAction } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { comparePassword } from '../utils/password';
import { ApiError } from '../utils/apiError';
import { prisma } from '../config/prisma';
import { toPublicUser } from './auth.service';

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return { ...toPublicUser(user), preferences: user.preferences };
  },

  async updateProfile(userId: string, input: { name?: string; avatarUrl?: string }) {
    const updated = await userRepository.update(userId, input);
    await auditLogRepository.log({ userId, action: AuditAction.PROFILE_UPDATED, metadata: input });
    return toPublicUser(updated);
  },

  async updatePreferences(
    userId: string,
    input: { theme?: string; notifications?: boolean; privateMode?: boolean; timezone?: string },
  ) {
    return userRepository.upsertPreferences(userId, input);
  },

  async submitFeedback(userId: string | undefined, input: { subject: string; message: string; rating?: number }) {
    return prisma.feedback.create({ data: { userId, ...input } });
  },

  async deleteAccount(userId: string, password: string) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw ApiError.notFound('User not found');

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Incorrect password');

    await refreshTokenRepository.revokeAllForUser(userId);
    await userRepository.softDelete(userId);
    await auditLogRepository.log({ userId, action: AuditAction.ACCOUNT_DELETED });
  },
};
