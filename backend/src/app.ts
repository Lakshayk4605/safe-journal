import express, { Express, Request } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import apiRouter from './routes';
import { requestId } from './middlewares/requestId.middleware';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { RESERVED_ROUTES_PREFIX } from './constants';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // needed for correct req.ip / rate limiting behind a load balancer

  // --- Security ---
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin === env.CLIENT_URL) return callback(null, true);
        
        // Match ngrok subdomains, localhost, and local network IPs
        const isAllowedPattern = 
          origin.endsWith('.ngrok-free.app') || 
          origin.endsWith('.ngrok-free.dev') ||
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') ||
          /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
          /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
          /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin);

        if (isAllowedPattern) {
          return callback(null, true);
        }

        logger.warn({ origin }, 'CORS request blocked');
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    }),
  );
  app.use(hpp());

  // --- Parsing ---
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(compression());

  // --- Observability ---
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: (req as unknown as Request).requestId }),
      autoLogging: { ignore: (req) => req.url === `${RESERVED_ROUTES_PREFIX}/health` },
    }),
  );

  // --- Rate limiting (global) ---
  app.use(RESERVED_ROUTES_PREFIX, globalRateLimiter);

  // --- API docs ---
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // --- Routes ---
  app.use(RESERVED_ROUTES_PREFIX, apiRouter);

  // --- Errors ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
