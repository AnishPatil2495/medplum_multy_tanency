import { createLogger } from '@repo/logger';
import { AppError, hashPassword } from '@repo/utils';
import { generateSlug } from '@repo/utils';
import type { Project, ClientApplication } from '@medplum/fhirtypes';
import type { CreateTenantResponse } from '@repo/types';

import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { getSuperAdminClient } from '../medplum/client-provider';
import { clientCache } from '../medplum/client-provider';
import type { CreateTenantDto } from '../validators/tenant.validator';

const log = createLogger({ name: 'tenant-service' });

export class TenantService {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async registerTenant(dto: CreateTenantDto): Promise<CreateTenantResponse> {
    const slug = dto.slug ?? generateSlug(dto.name);

    if (await this.tenantRepo.slugExists(slug)) {
      throw AppError.conflict(`Tenant slug "${slug}" is already taken`);
    }

    log.info({ slug }, 'Provisioning new Medplum project for tenant');

    // Use super-admin client to provision a new Medplum Project + Client
    const superAdmin = await getSuperAdminClient();

    // Create a Medplum Project for this tenant
    const project = await superAdmin.createResource<Project>({
      resourceType: 'Project',
      name: dto.name,
      strictMode: false,
    });

    if (!project.id) {
      throw AppError.medplumError('Medplum did not return a project ID');
    }

    // Create a ClientApplication within that project so the tenant can authenticate
    const clientApp = await superAdmin.createResource<ClientApplication>({
      resourceType: 'ClientApplication',
      name: `${dto.name} API Client`,
      description: `Auto-generated client for tenant ${slug}`,
      redirectUri: 'http://localhost',
    });

    if (!clientApp.id || !clientApp.secret) {
      throw AppError.medplumError('Medplum did not return client credentials');
    }

    const clientSecret = clientApp.secret;

    // Persist tenant in our database
    const tenant = await this.tenantRepo.create({
      name: dto.name,
      slug,
      projectId: project.id,
      clientId: clientApp.id,
      clientSecret,
      medplumBaseUrl: process.env['MEDPLUM_BASE_URL'] ?? 'http://localhost:8103',
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

    log.info({ tenantId: tenant.id, slug, projectId: project.id }, 'Tenant registered');

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
        projectId: project.id!,
        clientId: clientApp.id!,
      },
    };
  }

  async getTenantBySlug(slug: string) {
    return this.tenantRepo.requireActiveBySlug(slug);
  }

  async invalidateClientCache(tenantId: string): Promise<void> {
    clientCache.invalidate(tenantId);
  }
}
