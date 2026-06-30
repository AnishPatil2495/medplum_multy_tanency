import { MedplumClient } from '@medplum/core';
import fetch from 'node-fetch';

import type { MedplumClientConfig } from './types';

/**
 * Creates and authenticates a Medplum client using client credentials flow.
 * Each call produces an isolated client — callers own the caching strategy.
 */
export async function createMedplumClient(config: MedplumClientConfig): Promise<MedplumClient> {
  const client = new MedplumClient({
    baseUrl: config.baseUrl,
    fhirUrlPath: config.fhirUrlPath ?? 'fhir/R4',
    fetch: fetch as unknown as typeof globalThis.fetch,
  });

  await client.startClientLogin(config.clientId, config.clientSecret);

  return client;
}

/**
 * Creates a super-admin client using a global client ID/secret.
 * Used for tenant provisioning operations in App 1.
 */
export async function createSuperAdminClient(
  baseUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<MedplumClient> {
  return createMedplumClient({ baseUrl, clientId, clientSecret });
}
