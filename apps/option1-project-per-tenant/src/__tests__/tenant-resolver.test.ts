import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { AppError } from '@repo/utils';

// Mock the client provider before importing middleware
vi.mock('../medplum/client-provider', () => ({
  getClientForTenant: vi.fn().mockResolvedValue({ /* mock client */ }),
}));

import { tenantResolver, requireTenant } from '../middleware/tenant-resolver';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    params: {},
    hostname: 'localhost',
    ...overrides,
  } as Request;
}

function mockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

describe('tenantResolver', () => {
  const mockTenantRepo = {
    requireActiveBySlug: vi.fn(),
    findBySlug: vi.fn(),
    findById: vi.fn(),
    findByProjectId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    slugExists: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next with error when no tenant slug is provided', async () => {
    const middleware = tenantResolver(mockTenantRepo as never);
    const req = mockRequest();
    const next = mockNext();

    await middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'BAD_REQUEST' }));
  });

  it('extracts tenant from X-Tenant-ID header', async () => {
    const fakeTenant = { id: 'tid', slug: 'acme', status: 'active', projectId: 'pid', clientId: 'cid', clientSecret: 'cs', medplumBaseUrl: 'http://localhost:8103' };
    mockTenantRepo.requireActiveBySlug.mockResolvedValueOnce(fakeTenant);

    const middleware = tenantResolver(mockTenantRepo as never);
    const req = mockRequest({ headers: { 'x-tenant-id': 'acme' } });
    const next = mockNext();

    await middleware(req, {} as Response, next);

    expect(mockTenantRepo.requireActiveBySlug).toHaveBeenCalledWith('acme');
    expect(req.tenant).toEqual(fakeTenant);
    expect(next).toHaveBeenCalledWith(); // called with no args = success
  });

  it('propagates repository errors', async () => {
    mockTenantRepo.requireActiveBySlug.mockRejectedValueOnce(AppError.tenantNotFound('unknown'));

    const middleware = tenantResolver(mockTenantRepo as never);
    const req = mockRequest({ headers: { 'x-tenant-id': 'unknown' } });
    const next = mockNext();

    await middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'TENANT_NOT_FOUND' }));
  });
});

describe('requireTenant', () => {
  it('throws internal error when tenant is not set', () => {
    const req = mockRequest();
    expect(() => requireTenant(req)).toThrow();
  });

  it('returns the tenant when set', () => {
    const fakeTenant = { id: 'tid', slug: 'acme' };
    const req = mockRequest();
    (req as never as { tenant: unknown }).tenant = fakeTenant;

    expect(requireTenant(req)).toEqual(fakeTenant);
  });
});
