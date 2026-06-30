import type { PrismaClient, UserProject } from '@repo/database';
import { AppError } from '@repo/utils';

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmailAndTenant(email: string, tenantId: string): Promise<UserProject | null> {
    return this.db.userProject.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });
  }

  async findById(id: string): Promise<UserProject | null> {
    return this.db.userProject.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    passwordSalt: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'practitioner' | 'patient' | 'staff';
    tenantId: string;
  }): Promise<UserProject> {
    return this.db.userProject.create({ data });
  }

  async existsByEmailAndTenant(email: string, tenantId: string): Promise<boolean> {
    const count = await this.db.userProject.count({
      where: { email, tenantId },
    });
    return count > 0;
  }

  async requireActiveById(id: string): Promise<UserProject> {
    const user = await this.findById(id);
    if (!user) throw AppError.notFound('User', id);
    if (!user.isActive) throw AppError.forbidden('User account is inactive');
    return user;
  }
}
