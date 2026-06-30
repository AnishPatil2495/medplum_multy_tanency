import { MedplumClientCache } from '@repo/medplum';
import type { MedplumClient } from '@repo/medplum';

import config from '../config';

/**
 * App 2 uses a SINGLE shared Medplum project.
 * One client serves all tenants — tenant isolation is enforced through
 * Organization references, not through separate Medplum clients.
 */
let sharedClient: MedplumClient | undefined;

const cache = new MedplumClientCache(60 * 60 * 1000); // 1 hour TTL

export async function getSharedClient(): Promise<MedplumClient> {
  return cache.getOrCreate('__shared__', {
    baseUrl: config.MEDPLUM_BASE_URL,
    clientId: config.MEDPLUM_CLIENT_ID,
    clientSecret: config.MEDPLUM_CLIENT_SECRET,
    projectId: config.MEDPLUM_PROJECT_ID,
  });
}

export function invalidateSharedClient(): void {
  cache.invalidate('__shared__');
  sharedClient = undefined;
}
