import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

export function createRateLimiter(windowMs: number, max: number): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
  });
}

export const defaultRateLimiter = createRateLimiter(60 * 1000, 100);
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 10);
