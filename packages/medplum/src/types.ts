import type { MedplumClient } from '@medplum/core';

export interface MedplumClientConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  projectId?: string;
  fhirUrlPath?: string;
  tokenUrl?: string;
}

export interface CachedClient {
  client: MedplumClient;
  createdAt: number;
  tenantId: string;
}

export type { MedplumClient };
