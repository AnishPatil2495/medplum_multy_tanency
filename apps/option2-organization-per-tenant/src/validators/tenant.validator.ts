import { z } from 'zod';

export const CreateTenantOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Slug must be lowercase alphanumeric with hyphens'),
  subscription: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(128),
  adminFirstName: z.string().min(1).max(50),
  adminLastName: z.string().min(1).max(50),
});

export type CreateTenantOrgDto = z.infer<typeof CreateTenantOrgSchema>;
