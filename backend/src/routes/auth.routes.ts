import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { authRateLimiter, passwordResetRateLimiter } from '../middlewares/rateLimiter.middleware';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/signup:
 *   post:
 *     summary: Create a new account
 *     tags: [Auth]
 */
router.post('/signup', authRateLimiter, validate(signupSchema), authController.signup);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

router.post('/logout', requireAuth, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', passwordResetRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', requireAuth, validate(changePasswordSchema), authController.changePassword);
router.get('/me', requireAuth, authController.me);

export default router;
