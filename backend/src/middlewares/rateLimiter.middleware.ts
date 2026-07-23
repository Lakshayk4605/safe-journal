import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/** General API rate limiter applied globally. */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.', code: 'TOO_MANY_REQUESTS' },
});

/** Strict limiter for auth endpoints to slow down brute-force / credential stuffing attacks. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many auth attempts, please try again later.', code: 'TOO_MANY_REQUESTS' },
});

/** Limiter for AI endpoints since these are expensive/costly calls. */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please slow down.', code: 'TOO_MANY_REQUESTS' },
});

/** Very strict limiter for password reset requests. */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts, please try again later.', code: 'TOO_MANY_REQUESTS' },
});
