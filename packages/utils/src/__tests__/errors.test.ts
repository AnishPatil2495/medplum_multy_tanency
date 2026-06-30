import { describe, it, expect } from 'vitest';

import { AppError, isAppError, toAppError } from '../errors';

describe('AppError', () => {
  it('creates a not-found error with correct shape', () => {
    const err = AppError.notFound('Patient', 'abc123');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toContain('abc123');
    expect(err.isOperational).toBe(true);
  });

  it('creates a validation error with details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const err = AppError.validationError('Validation failed', details);
    expect(err.statusCode).toBe(422);
    expect(err.details).toEqual(details);
  });

  it('creates an unauthorized error', () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('creates a conflict error', () => {
    const err = AppError.conflict('Slug taken');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Slug taken');
  });

  it('creates tenant-specific errors', () => {
    const notFound = AppError.tenantNotFound('acme');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe('TENANT_NOT_FOUND');

    const inactive = AppError.tenantInactive('acme');
    expect(inactive.statusCode).toBe(403);
    expect(inactive.code).toBe('TENANT_INACTIVE');
  });
});

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(AppError.unauthorized())).toBe(true);
  });

  it('returns false for plain errors', () => {
    expect(isAppError(new Error('plain'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe('toAppError', () => {
  it('returns the same error if already AppError', () => {
    const original = AppError.notFound('X');
    expect(toAppError(original)).toBe(original);
  });

  it('wraps a plain Error', () => {
    const wrapped = toAppError(new Error('plain'));
    expect(isAppError(wrapped)).toBe(true);
    expect(wrapped.message).toBe('plain');
  });

  it('wraps an unknown value', () => {
    const wrapped = toAppError('something unexpected');
    expect(wrapped.statusCode).toBe(500);
  });
});
