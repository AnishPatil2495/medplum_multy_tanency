import type { Request, Response, NextFunction } from 'express';

import { createLogger } from '@repo/logger';
import { generateRequestId } from '@repo/utils';

const log = createLogger({ name: 'http' });

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  const startTime = Date.now();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    log[level](
      {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        contentLength: res.getHeader('content-length'),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
      `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
    );
  });

  next();
}
