export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'TENANT_NOT_FOUND'
  | 'TENANT_INACTIVE'
  | 'USER_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'FHIR_ERROR'
  | 'MEDPLUM_ERROR'
  | 'DATABASE_ERROR'
  | 'RATE_LIMIT_EXCEEDED';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError('BAD_REQUEST', message, 400, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }

  static notFound(resource: string, id?: string): AppError {
    const msg = id ? `${resource} with id "${id}" not found` : `${resource} not found`;
    return new AppError('NOT_FOUND', msg, 404);
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', message, 409);
  }

  static validationError(message: string, details?: unknown): AppError {
    return new AppError('VALIDATION_ERROR', message, 422, details);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL_ERROR', message, 500, undefined, false);
  }

  static tenantNotFound(slug: string): AppError {
    return new AppError('TENANT_NOT_FOUND', `Tenant "${slug}" not found`, 404);
  }

  static tenantInactive(slug: string): AppError {
    return new AppError('TENANT_INACTIVE', `Tenant "${slug}" is not active`, 403);
  }

  static fhirError(message: string, details?: unknown): AppError {
    return new AppError('FHIR_ERROR', message, 422, details);
  }

  static medplumError(message: string, details?: unknown): AppError {
    return new AppError('MEDPLUM_ERROR', message, 502, details);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new AppError('INTERNAL_ERROR', error.message, 500, undefined, false);
  }
  return new AppError('INTERNAL_ERROR', 'An unexpected error occurred', 500, undefined, false);
}
