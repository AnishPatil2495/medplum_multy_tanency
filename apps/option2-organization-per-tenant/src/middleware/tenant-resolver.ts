import type { Request, Response, NextFunction } from 'express';
import type { Organization } from '@medplum/fhirtypes';

import { createLogger } from '@repo/logger';
import { AppError } from '@repo/utils';

import { TenantOrgRepository } from '../repositories/tenant.repository';
import { getSharedClient } from '../medplum/client-provider';
import type { TenantOrg } from '../types';

const log = createLogger({ name: 'tenant-resolver-app2' });

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

export function tenantOrgResolver(tenantRepo: TenantOrgRepository) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const slug = extractTenantSlug(req);

    if (!slug) {
      return next(AppError.badRequest('Tenant identifier is required. Provide X-Tenant-ID header.'));
    }

    try {
      const tenant = await tenantRepo.requireActiveBySlug(slug);
      req.tenant = tenant as TenantOrg;

      // Load the FHIR Organization resource for this tenant
      const client = await getSharedClient();
      req.medplumClient = client;

      const org = await client.readResource('Organization', tenant.fhirOrganizationId);
      req.organization = org as Organization;

      log.debug({ tenantId: tenant.id, orgId: tenant.fhirOrganizationId }, 'Tenant org resolved');
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireTenantOrg(req: Request): TenantOrg {
  if (!req.tenant) {
    throw AppError.internal('Tenant not resolved — tenantOrgResolver middleware missing');
  }
  return req.tenant as TenantOrg;
}

export function requireOrganization(req: Request): Organization {
  if (!req.organization) {
    throw AppError.internal('Organization not resolved — tenantOrgResolver middleware missing');
  }
  return req.organization;
}
