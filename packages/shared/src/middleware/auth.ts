import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { AppError } from '@repo/utils';
import type { AuthenticatedUser } from '@repo/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(jwtSecret: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Missing or invalid Authorization header'));
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, jwtSecret) as AuthenticatedUser;
      req.user = payload;
      next();
    } catch {
      next(AppError.unauthorized('Invalid or expired token'));
    }
  };
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Role "${req.user.role}" is not permitted. Required: ${roles.join(', ')}`),
      );
    }
    next();
  };
}

export function signToken(payload: AuthenticatedUser, secret: string, expiresIn: string): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}
