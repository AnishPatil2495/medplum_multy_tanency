import type { Organization } from '@medplum/fhirtypes';

import { createLogger } from '@repo/logger';
import { AppError, hashPassword, generateSlug } from '@repo/utils';
import type { CreateTenantResponse } from '@repo/types';

import { TenantOrgRepository } from '../repositories/tenant.repository';
import { UserOrgRepository } from '../repositories/user.repository';
import { getSharedClient } from '../medplum/client-provider';
import type { CreateTenantOrgDto } from '../validators/tenant.validator';

const log = createLogger({ name: 'tenant-service-app2' });

export class TenantOrgService {
  constructor(
    private readonly tenantRepo: TenantOrgRepository,
    private readonly userRepo: UserOrgRepository,
  ) {}

  async registerTenant(dto: CreateTenantOrgDto): Promise<CreateTenantResponse> {
    const slug = dto.slug ?? generateSlug(dto.name);

    if (await this.tenantRepo.slugExists(slug)) {
      throw AppError.conflict(`Tenant slug "${slug}" is already taken`);
    }

    log.info({ slug }, 'Creating FHIR Organization for new tenant');

    const client = await getSharedClient();

    // Create a FHIR Organization resource representing this tenant
    const org = await client.createResource<Organization>({
      resourceType: 'Organization',
      name: dto.name,
      active: true,
      identifier: [{ system: 'http://example.com/tenant-slug', value: slug }],
    });

    if (!org.id) {
      throw AppError.medplumError('Medplum did not return an Organization ID');
    }

    // Persist the tenant→Organization mapping in our database
    const tenant = await this.tenantRepo.create({
      name: dto.name,
      slug,
      fhirOrganizationId: org.id,
    });

    // Create admin user in our database
    const { hash, salt } = hashPassword(dto.adminPassword);
    const adminUser = await this.userRepo.create({
      email: dto.adminEmail,
      passwordHash: hash,
      passwordSalt: salt,
      firstName: dto.adminFirstName,
      lastName: dto.adminLastName,
      role: 'admin',
      tenantId: tenant.id,
    });

    log.info({ tenantId: tenant.id, slug, orgId: org.id }, 'Tenant registered with Organization');

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status as 'active',
        subscription: tenant.subscription as 'free',
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
      },
      credentials: {
        organizationId: org.id,
      },
    };
  }
}
