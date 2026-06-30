import { createLogger } from '@repo/logger';

import { createMedplumClient } from './client-factory';
import type { CachedClient, MedplumClient, MedplumClientConfig } from './types';

const log = createLogger({ name: 'medplum-cache' });

/**
 * LRU-style in-memory cache for Medplum clients keyed by tenantId.
 * TTL-based eviction prevents stale credentials from being used after rotation.
 */
export class MedplumClientCache {
  private readonly cache = new Map<string, CachedClient>();
  private readonly ttlMs: number;

  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  async getOrCreate(tenantId: string, config: MedplumClientConfig): Promise<MedplumClient> {
    const cached = this.cache.get(tenantId);

    if (cached && Date.now() - cached.createdAt < this.ttlMs) {
      log.debug({ tenantId }, 'Returning cached Medplum client');
      return cached.client;
    }

    if (cached) {
      log.debug({ tenantId }, 'Cached client expired, creating new one');
      this.cache.delete(tenantId);
    }

    log.debug({ tenantId }, 'Creating new Medplum client');
    const client = await createMedplumClient(config);

    this.cache.set(tenantId, { client, createdAt: Date.now(), tenantId });
    return client;
  }

  invalidate(tenantId: string): void {
    this.cache.delete(tenantId);
    log.debug({ tenantId }, 'Invalidated Medplum client cache');
  }

  invalidateAll(): void {
    this.cache.clear();
    log.debug('Invalidated all Medplum client caches');
  }

  size(): number {
    return this.cache.size;
  }

  /** Evicts all entries older than the configured TTL */
  evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt >= this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }
}
