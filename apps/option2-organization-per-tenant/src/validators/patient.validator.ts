import { z } from 'zod';

const IdentifierSchema = z.object({
  system: z.string().url().optional(),
  value: z.string().min(1),
});

const AddressSchema = z.object({
  line: z.array(z.string()).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const CreatePatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  birthDate: z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'birthDate must be YYYY, YYYY-MM, or YYYY-MM-DD')
    .optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: AddressSchema.optional(),
  identifiers: z.array(IdentifierSchema).optional(),
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

export const PatientSearchSchema = z.object({
  name: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  email: z.string().optional(),
  identifier: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const IdParamSchema = z.object({ id: z.string().min(1) });

export type CreatePatientDto = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientDto = z.infer<typeof UpdatePatientSchema>;
export type PatientSearchDto = z.infer<typeof PatientSearchSchema>;
