import { z } from 'zod';

export const CreatePractitionerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  qualification: z.string().optional(),
});

export const UpdatePractitionerSchema = CreatePractitionerSchema.partial();

export const PractitionerSearchSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type CreatePractitionerDto = z.infer<typeof CreatePractitionerSchema>;
export type UpdatePractitionerDto = z.infer<typeof UpdatePractitionerSchema>;
