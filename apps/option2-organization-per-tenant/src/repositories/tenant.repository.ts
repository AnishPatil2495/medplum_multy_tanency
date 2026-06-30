import type { PrismaClient, TenantOrg } from '@repo/database';
import { AppError } from '@repo/utils';

export class TenantOrgRepository {
  constructor(private readonly db: PrismaClient) {}

  async findBySlug(slug: string): Promise<TenantOrg | null> {
    return this.db.tenantOrg.findUnique({ where: { slug } });
  }

  async findById(id: string): Promise<TenantOrg | null> {
    return this.db.tenantOrg.findUnique({ where: { id } });
  }

  async findByFhirOrgId(fhirOrganizationId: string): Promise<TenantOrg | null> {
    return this.db.tenantOrg.findUnique({ where: { fhirOrganizationId } });
  }

  async create(data: {
    name: string;
    slug: string;
    fhirOrganizationId: string;
  }): Promise<TenantOrg> {
    return this.db.tenantOrg.create({ data });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.db.tenantOrg.count({ where: { slug } });
    return count > 0;
  }

  async requireActiveBySlug(slug: string): Promise<TenantOrg> {
    const tenant = await this.findBySlug(slug);
    if (!tenant) throw AppError.tenantNotFound(slug);
    if (tenant.status !== 'active') throw AppError.tenantInactive(slug);
    return tenant;
  }
}
