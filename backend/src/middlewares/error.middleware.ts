import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return ApiError.conflict(`A record with this ${target} already exists`);
    }
    case 'P2025':
      return ApiError.notFound('Record not found');
    case 'P2003':
      return ApiError.badRequest('Invalid reference to a related record');
    default:
      return ApiError.internal('Database error');
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = mapPrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    apiError = ApiError.badRequest('Invalid data provided to database layer');
  } else if (err instanceof Error && err.name === 'MulterError') {
    apiError = ApiError.badRequest(err.message);
  } else {
    apiError = ApiError.internal(isProduction ? 'Something went wrong' : (err as Error)?.message);
  }

  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: apiError.statusCode,
    userId: req.user?.id,
  };

  if (apiError.statusCode >= 500) {
    logger.error({ ...logPayload, err }, 'Unhandled server error');
  } else {
    logger.warn(logPayload, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    code: apiError.code,
    details: apiError.details,
    ...(isProduction ? {} : { stack: (err as Error)?.stack }),
  });
}
