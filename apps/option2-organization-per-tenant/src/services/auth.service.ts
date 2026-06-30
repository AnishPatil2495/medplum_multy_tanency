import { createLogger } from '@repo/logger';
import { AppError, hashPassword, verifyPassword } from '@repo/utils';
import { signToken } from '@repo/shared';
import type { LoginResponse } from '@repo/types';

import { UserOrgRepository } from '../repositories/user.repository';
import type { RegisterUserDto, LoginDto } from '../validators/user.validator';
import config from '../config';

const log = createLogger({ name: 'auth-service-app2' });

export class AuthOrgService {
  constructor(private readonly userRepo: UserOrgRepository) {}

  async register(dto: RegisterUserDto, tenantId: string) {
    const exists = await this.userRepo.existsByEmailAndTenant(dto.email, tenantId);
    if (exists) {
      throw AppError.conflict(`User with email "${dto.email}" already exists in this tenant`);
    }

    const { hash, salt } = hashPassword(dto.password);
    const user = await this.userRepo.create({
      email: dto.email,
      passwordHash: hash,
      passwordSalt: salt,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? 'staff',
      tenantId,
    });

    log.info({ userId: user.id, tenantId }, 'User registered (org tenant)');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  async login(dto: LoginDto, tenantId: string, tenantSlug: string): Promise<LoginResponse> {
    const user = await this.userRepo.findByEmailAndTenant(dto.email, tenantId);
    if (!user) throw AppError.unauthorized('Invalid email or password');
    if (!user.isActive) throw AppError.forbidden('User account is inactive');

    const passwordValid = verifyPassword(dto.password, user.passwordHash, user.passwordSalt);
    if (!passwordValid) throw AppError.unauthorized('Invalid email or password');

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'admin' | 'practitioner' | 'patient' | 'staff',
      tenantId,
      tenantSlug,
    };

    const accessToken = signToken(payload, config.JWT_SECRET, config.JWT_EXPIRES_IN);
    const expiresIn = config.JWT_EXPIRES_IN.endsWith('h')
      ? parseInt(config.JWT_EXPIRES_IN) * 3600
      : 3600;

    log.info({ userId: user.id, tenantId }, 'User logged in (org tenant)');

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'admin',
        tenantId: user.tenantId,
        isActive: user.isActive,
      },
    };
  }
}
