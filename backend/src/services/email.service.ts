import { Resend } from 'resend';
import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  welcomeEmailTemplate,
} from '../emails/templates';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // In dev/test without an API key configured, log instead of failing the request.
    logger.info({ to, subject }, 'RESEND_API_KEY not set — email not sent (dev mode)');
    return;
  }
  try {
    await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
  }
}

export const emailService = {
  sendVerificationEmail(to: string, name: string, token: string) {
    const url = `${env.CLIENT_URL}/auth/verify-email?token=${token}`;
    return send(to, 'Verify your Safe Journal account', verificationEmailTemplate(name, url));
  },

  sendPasswordResetEmail(to: string, name: string, token: string) {
    const url = `${env.CLIENT_URL}/auth/reset-password?token=${token}`;
    return send(to, 'Reset your Safe Journal password', passwordResetEmailTemplate(name, url));
  },

  sendWelcomeEmail(to: string, name: string) {
    return send(to, 'Welcome to Safe Journal', welcomeEmailTemplate(name));
  },
};
