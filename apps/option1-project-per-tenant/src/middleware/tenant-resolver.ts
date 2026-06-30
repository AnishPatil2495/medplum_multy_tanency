import type { Request, Response, NextFunction } from 'express';

import { createLogger } from '@repo/logger';
import { AppError } from '@repo/utils';

import { TenantRepository } from '../repositories/tenant.repository';
import { getClientForTenant } from '../medplum/client-provider';
import type { TenantProject } from '../types';

const log = createLogger({ name: 'tenant-resolver' });

/**
 * Tenant resolution strategy — checks three sources in order:
 * 1. X-Tenant-ID header (slug)
 * 2. :tenantSlug route param
 * 3. Subdomain (e.g. acme.api.example.com)
 */
function extractTenantSlug(req: Request): string | undefined {
  const header = req.headers['x-tenant-id'] as string | undefined;
  if (header) return header.trim();

  const param = req.params['tenantSlug'];
  if (param) return param.trim();

  const host = req.hostname;
  const parts = host.split('.');
  if (parts.length >= 3) return parts[0];

  return undefined;
}

export function tenantResolver(tenantRepo: TenantRepository) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const slug = extractTenantSlug(req);

    if (!slug) {
      return next(AppError.badRequest('Tenant identifier is required. Provide X-Tenant-ID header.'));
    }

    try {
      const tenant = await tenantRepo.requireActiveBySlug(slug);

      // Attach tenant to request for downstream handlers
      req.tenant = tenant as TenantProject;

      // Pre-load Medplum client so controllers don't need to await auth on every call
      req.medplumClient = await getClientForTenant(tenant);

      log.debug({ tenantId: tenant.id, tenantSlug: slug }, 'Tenant resolved');
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Guard to assert tenant is already resolved before using in a controller */
export function requireTenant(req: Request): TenantProject {
  if (!req.tenant) {
    throw AppError.internal('Tenant not resolved — tenantResolver middleware missing');
  }
  return req.tenant as TenantProject;
}
