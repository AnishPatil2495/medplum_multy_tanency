import type { PrismaClient, TenantProject } from '@repo/database';
import { AppError } from '@repo/utils';

export class TenantRepository {
  constructor(private readonly db: PrismaClient) {}

  async findBySlug(slug: string): Promise<TenantProject | null> {
    return this.db.tenantProject.findUnique({ where: { slug } });
  }

  async findById(id: string): Promise<TenantProject | null> {
    return this.db.tenantProject.findUnique({ where: { id } });
  }

  async findByProjectId(projectId: string): Promise<TenantProject | null> {
    return this.db.tenantProject.findUnique({ where: { projectId } });
  }

  async create(data: {
    name: string;
    slug: string;
    projectId: string;
    clientId: string;
    clientSecret: string;
    medplumBaseUrl: string;
  }): Promise<TenantProject> {
    return this.db.tenantProject.create({ data });
  }

  async updateStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<TenantProject> {
    return this.db.tenantProject.update({ where: { id }, data: { status } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.db.tenantProject.count({ where: { slug } });
    return count > 0;
  }

  async requireActiveBySlug(slug: string): Promise<TenantProject> {
    const tenant = await this.findBySlug(slug);
    if (!tenant) throw AppError.tenantNotFound(slug);
    if (tenant.status !== 'active') throw AppError.tenantInactive(slug);
    return tenant;
  }
}
