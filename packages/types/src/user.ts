export type UserRole = 'admin' | 'practitioner' | 'patient' | 'staff';

export interface UserBase {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: Omit<UserBase, 'createdAt' | 'updatedAt'>;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantSlug: string;
}
