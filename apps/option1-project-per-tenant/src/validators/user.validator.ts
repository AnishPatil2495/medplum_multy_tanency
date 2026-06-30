import { z } from 'zod';

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['admin', 'practitioner', 'patient', 'staff']).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
