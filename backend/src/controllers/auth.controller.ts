import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { COOKIE_NAMES } from '../constants';
import { env, isProduction } from '../config/env';
import { ApiError } from '../utils/apiError';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/v1/auth',
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessCookieOptions);
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res: Response) {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { ...accessCookieOptions, maxAge: undefined });
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...refreshCookieOptions, maxAge: undefined });
}

function context(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body, context(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, 201, 'Account created successfully. Please check your email to verify your account.', {
      user: result.user,
      accessToken: env.NODE_ENV === 'test' ? result.accessToken : undefined,
    });
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, context(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, 200, 'Logged in successfully', {
      user: result.user,
      accessToken: env.NODE_ENV === 'test' ? result.accessToken : undefined,
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    await authService.logout(refreshToken, req.user?.id, context(req));
    clearAuthCookies(res);
    sendSuccess(res, 200, 'Logged out successfully', null);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    const result = await authService.refresh(refreshToken, context(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, 200, 'Token refreshed', { user: result.user });
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const token = req.query.token as string;
    const user = await authService.verifyEmail(token);
    sendSuccess(res, 200, 'Email verified successfully', { user });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, 200, 'If an account exists for this email, a reset link has been sent.', null);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, 200, 'Password reset successfully. Please log in again.', null);
  }),

  changePassword: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    clearAuthCookies(res);
    sendSuccess(res, 200, 'Password changed. Please log in again with your new password.', null);
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    sendSuccess(res, 200, 'Current session', { user: req.user });
  }),

  tempSeed: asyncHandler(async (_req, res) => {
    const adminPasswordHash = await bcrypt.hash('AdminPass123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@safejournal.app' },
      update: {},
      create: {
        name: 'Safe Journal Admin',
        email: 'admin@safejournal.app',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        isEmailVerified: true,
        preferences: { create: {} },
      },
    });

    const demoPasswordHash = await bcrypt.hash('DemoPass123', 12);
    const demoUser = await prisma.user.upsert({
      where: { email: 'alex.chen@example.com' },
      update: {},
      create: {
        name: 'Alex Chen',
        email: 'alex.chen@example.com',
        passwordHash: demoPasswordHash,
        role: 'USER',
        isEmailVerified: true,
        streakDays: 12,
        totalEntries: 0,
        preferences: { create: {} },
      },
    });

    sendSuccess(res, 200, 'Database seeded successfully', { adminId: admin.id, demoUserId: demoUser.id });
  }),
};
