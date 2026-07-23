import { NextFunction, Request, Response } from 'express';
import { COOKIE_NAMES } from '../constants';
import { ApiError } from '../utils/apiError';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }
  return null;
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
  });

  if (!user || !user.isActive || user.deletedAt) {
    throw ApiError.unauthorized('Account is no longer active');
  }

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
});

/** Attaches req.user if a valid token is present, but does not fail the request otherwise. */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });
    if (user && user.isActive && !user.deletedAt) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
});
