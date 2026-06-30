import { MedplumClientCache, createMedplumClient } from '@repo/medplum';
import type { MedplumClient } from '@repo/medplum';
import type { TenantProject } from '@repo/database';

import config from '../config';

/** Singleton cache shared across all requests in this process */
export const clientCache = new MedplumClientCache(config.CLIENT_CACHE_TTL_MS);

/**
 * Returns a Medplum client authenticated to the given tenant's Medplum project.
 * Uses the LRU cache to avoid re-authenticating on every request.
 */
export async function getClientForTenant(tenant: TenantProject): Promise<MedplumClient> {
  return clientCache.getOrCreate(tenant.id, {
    baseUrl: tenant.medplumBaseUrl,
    clientId: tenant.clientId,
    clientSecret: tenant.clientSecret,
    projectId: tenant.projectId,
  });
}

/**
 * Creates a new super-admin client for provisioning operations.
 * Never cached — always fresh credentials.
 */
export async function getSuperAdminClient(): Promise<MedplumClient> {
  return createMedplumClient({
    baseUrl: config.MEDPLUM_BASE_URL,
    clientId: config.MEDPLUM_SUPER_ADMIN_CLIENT_ID,
    clientSecret: config.MEDPLUM_SUPER_ADMIN_CLIENT_SECRET,
  });
}
