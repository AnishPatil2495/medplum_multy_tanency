import type { Request, Response, NextFunction } from 'express';

import { createLogger } from '@repo/logger';
import type { ApiResponse } from '@repo/types';
import { AppError, isAppError, toAppError } from '@repo/utils';

const log = createLogger({ name: 'error-handler' });

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError = isAppError(err) ? err : toAppError(err);
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? 'unknown';

  if (!appError.isOperational || appError.statusCode >= 500) {
    log.error(
      {
        err: appError,
        requestId,
        method: req.method,
        url: req.url,
        statusCode: appError.statusCode,
      },
      appError.message,
    );
  } else {
    log.warn(
      {
        code: appError.code,
        requestId,
        method: req.method,
        url: req.url,
        statusCode: appError.statusCode,
      },
      appError.message,
    );
  }

  const body: ApiResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: process.env['NODE_ENV'] !== 'production' ? appError.details : undefined,
      requestId,
    },
  };

  res.status(appError.statusCode).json(body);
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.url}`));
}
