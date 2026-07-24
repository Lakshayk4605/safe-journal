import { AuditAction } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { comparePassword, generateSecureToken, hashPassword, hashToken } from '../utils/password';
import { refreshTokenExpiryDate, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/apiError';
import { emailService } from './email.service';
import { TOKEN_EXPIRY } from '../constants';
import { prisma } from '../config/prisma';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  streakDays: number;
  totalEntries: number;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    streakDays: user.streakDays,
    totalEntries: user.totalEntries,
    createdAt: user.createdAt,
  };
}

async function issueTokenPair(userId: string, email: string, role: string, ctx: RequestContext) {
  const accessToken = signAccessToken({ sub: userId, email, role });

  const rawRefreshToken = generateSecureToken(40);
  const tokenHash = hashToken(rawRefreshToken);

  const record = await refreshTokenRepository.create({
    userId,
    tokenHash,
    expiresAt: refreshTokenExpiryDate(),
    userAgent: ctx.userAgent,
    ipAddress: ctx.ipAddress,
  });

  const refreshToken = signRefreshToken({ sub: userId, jti: record.id });

  return { accessToken, refreshToken, rawRefreshToken };
}

export const authService = {
  async signup(input: { name: string; email: string; password: string }, ctx: RequestContext) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const emailVerificationToken = generateSecureToken();
    const emailVerificationExpiresAt = new Date(
      Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000,
    );

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      emailVerificationToken,
      emailVerificationExpiresAt,
      preferences: { create: {} },
    });

    await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);
    await auditLogRepository.log({
      userId: user.id,
      action: AuditAction.USER_SIGNUP,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    const tokens = await issueTokenPair(user.id, user.email, user.role, ctx);
    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: { email: string; password: string }, ctx: RequestContext) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const validPassword = await comparePassword(input.password, user.passwordHash);
    if (!validPassword) {
      await auditLogRepository.log({
        userId: user.id,
        action: AuditAction.USER_LOGIN_FAILED,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated');
    }

    await auditLogRepository.log({
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    const tokens = await issueTokenPair(user.id, user.email, user.role, ctx);
    return { user: toPublicUser(user), ...tokens };
  },

  async logout(refreshTokenRaw: string | undefined, userId: string | undefined, ctx: RequestContext) {
    if (refreshTokenRaw) {
      const tokenHash = hashToken(refreshTokenRaw);
      const record = await refreshTokenRepository.findByHash(tokenHash);
      if (record && !record.revokedAt) {
        await refreshTokenRepository.revoke(record.id);
      }
    }
    if (userId) {
      await auditLogRepository.log({
        userId,
        action: AuditAction.USER_LOGOUT,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    }
  },

  async refresh(refreshTokenRaw: string | undefined, ctx: RequestContext) {
    if (!refreshTokenRaw) {
      throw ApiError.unauthorized('Refresh token missing');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenRaw);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshTokenRaw);
    const record = await refreshTokenRepository.findByHash(tokenHash);

    if (!record || record.revokedAt || record.expiresAt < new Date() || record.id !== payload.jti) {
      // Reuse of a revoked/rotated token is a strong signal of theft — revoke the whole family.
      if (record && !record.revokedAt) {
        await refreshTokenRepository.revokeAllForUser(record.userId);
      }
      throw ApiError.unauthorized('Refresh token is no longer valid');
    }

    const user = await userRepository.findByIdWithPassword(payload.sub);
    if (!user || !user.isActive || user.deletedAt) {
      throw ApiError.unauthorized('Account is no longer active');
    }

    // Rotate: revoke the old token and issue a brand-new pair.
    const tokens = await issueTokenPair(user.id, user.email, user.role, ctx);
    const newTokenHash = hashToken(tokens.rawRefreshToken);
    await refreshTokenRepository.revoke(record.id, newTokenHash);

    await auditLogRepository.log({
      userId: user.id,
      action: AuditAction.TOKEN_REFRESHED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { user: toPublicUser(user), ...tokens };
  },

  async verifyEmail(token: string) {
    const user = await userRepository.findByEmailVerificationToken(token);
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw ApiError.badRequest('Verification link is invalid or has expired');
    }

    const updated = await userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    });

    await emailService.sendWelcomeEmail(updated.email, updated.name);
    await auditLogRepository.log({ userId: user.id, action: AuditAction.EMAIL_VERIFIED });

    return toPublicUser(updated);
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    // Always respond success-shaped to avoid leaking whether an email is registered.
    if (!user || user.deletedAt) return;

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET_MINUTES * 60 * 1000);

    await userRepository.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    });

    await emailService.sendPasswordResetEmail(user.email, user.name, token);
    await auditLogRepository.log({ userId: user.id, action: AuditAction.PASSWORD_RESET_REQUESTED });
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await userRepository.findByPasswordResetToken(token);
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw ApiError.badRequest('Reset link is invalid or has expired');
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });

    // Invalidate all existing sessions on password reset.
    await refreshTokenRepository.revokeAllForUser(user.id);
    await auditLogRepository.log({ userId: user.id, action: AuditAction.PASSWORD_RESET_COMPLETED });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw ApiError.notFound('User not found');

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    await userRepository.update(userId, { passwordHash });
    await refreshTokenRepository.revokeAllForUser(userId);
    await auditLogRepository.log({ userId, action: AuditAction.PASSWORD_CHANGED });
  },
};

export { toPublicUser };
