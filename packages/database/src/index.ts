export { PrismaClient } from '@prisma/client';
export * from './client';
// Prisma model types are re-exported after code generation
// When Prisma has not yet generated, TypeScript will resolve these from the generated output
export type {
  TenantProject,
  TenantOrg,
  UserProject,
  UserOrg,
  TenantStatus,
  SubscriptionPlan,
  UserRole,
  Prisma,
} from '@prisma/client';
