import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';

import { AppError } from '@repo/utils';

type RequestPart = 'body' | 'query' | 'params';

export function validate<T>(schema: z.ZodSchema<T>, part: RequestPart = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(AppError.validationError('Request validation failed', details));
    }
    req[part] = result.data as typeof req[typeof part];
    next();
  };
}

export function validateBody<T>(schema: z.ZodSchema<T>): RequestHandler {
  return validate(schema, 'body');
}

export function validateQuery<T>(schema: z.ZodSchema<T>): RequestHandler {
  return validate(schema, 'query');
}

export function validateParams<T>(schema: z.ZodSchema<T>): RequestHandler {
  return validate(schema, 'params');
}
