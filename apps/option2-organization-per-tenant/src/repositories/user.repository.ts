import type { PrismaClient, UserOrg } from '@repo/database';
import { AppError } from '@repo/utils';

export class UserOrgRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmailAndTenant(email: string, tenantId: string): Promise<UserOrg | null> {
    return this.db.userOrg.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });
  }

  async findById(id: string): Promise<UserOrg | null> {
    return this.db.userOrg.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    passwordSalt: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'practitioner' | 'patient' | 'staff';
    tenantId: string;
  }): Promise<UserOrg> {
    return this.db.userOrg.create({ data });
  }

  async existsByEmailAndTenant(email: string, tenantId: string): Promise<boolean> {
    const count = await this.db.userOrg.count({ where: { email, tenantId } });
    return count > 0;
  }

  async requireActiveById(id: string): Promise<UserOrg> {
    const user = await this.findById(id);
    if (!user) throw AppError.notFound('User', id);
    if (!user.isActive) throw AppError.forbidden('User account is inactive');
    return user;
  }
}
