import type { TenantProject, UserProject } from '@repo/database';
import type { MedplumClient } from '@repo/medplum';

export type { TenantProject, UserProject };

/** Augment Express Request with tenant context for App 1 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantProject;
      medplumClient?: MedplumClient;
    }
  }
}
