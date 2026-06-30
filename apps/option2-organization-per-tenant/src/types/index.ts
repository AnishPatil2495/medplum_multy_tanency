import type { TenantOrg, UserOrg } from '@repo/database';
import type { MedplumClient } from '@repo/medplum';
import type { Organization } from '@medplum/fhirtypes';

export type { TenantOrg, UserOrg };

/** Augment Express Request with tenant + organization context for App 2 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantOrg;
      organization?: Organization;
      medplumClient?: MedplumClient;
    }
  }
}
