import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config so JWT_SECRET is available
vi.mock('../config', () => ({
  default: {
    JWT_SECRET: 'test-secret-key-for-testing-only-32chars',
    JWT_EXPIRES_IN: '1h',
  },
}));

import { AuthService } from '../services/auth.service';

const mockUserRepo = {
  findByEmailAndTenant: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  existsByEmailAndTenant: vi.fn(),
  requireActiveById: vi.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(mockUserRepo as never);
  });

  describe('register', () => {
    it('creates a user when the email is not taken', async () => {
      mockUserRepo.existsByEmailAndTenant.mockResolvedValueOnce(false);
      mockUserRepo.create.mockResolvedValueOnce({
        id: 'uid1',
        email: 'user@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'staff',
        tenantId: 'tid1',
      });

      const result = await service.register(
        { email: 'user@test.com', password: 'Password123!', firstName: 'John', lastName: 'Doe' },
        'tid1',
      );

      expect(result.email).toBe('user@test.com');
      expect(mockUserRepo.create).toHaveBeenCalledOnce();
    });

    it('throws conflict when email already exists', async () => {
      mockUserRepo.existsByEmailAndTenant.mockResolvedValueOnce(true);

      await expect(
        service.register(
          { email: 'dup@test.com', password: 'Password123!', firstName: 'A', lastName: 'B' },
          'tid1',
        ),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('login', () => {
    it('throws unauthorized for unknown email', async () => {
      mockUserRepo.findByEmailAndTenant.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'ghost@test.com', password: 'any' }, 'tid1', 'slug1'),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('throws unauthorized for wrong password', async () => {
      // Store a real hashed password
      const { hashPassword } = await import('@repo/utils');
      const { hash, salt } = hashPassword('correct');

      mockUserRepo.findByEmailAndTenant.mockResolvedValueOnce({
        id: 'uid1',
        email: 'u@test.com',
        passwordHash: hash,
        passwordSalt: salt,
        role: 'staff',
        tenantId: 'tid1',
        isActive: true,
      });

      await expect(
        service.login({ email: 'u@test.com', password: 'wrong' }, 'tid1', 'slug1'),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('returns a JWT for correct credentials', async () => {
      const { hashPassword } = await import('@repo/utils');
      const { hash, salt } = hashPassword('correct');

      mockUserRepo.findByEmailAndTenant.mockResolvedValueOnce({
        id: 'uid1',
        email: 'u@test.com',
        passwordHash: hash,
        passwordSalt: salt,
        role: 'admin',
        tenantId: 'tid1',
        isActive: true,
      });

      const result = await service.login(
        { email: 'u@test.com', password: 'correct' },
        'tid1',
        'slug1',
      );

      expect(result.accessToken).toBeTruthy();
      expect(result.tokenType).toBe('Bearer');
    });
  });
});
