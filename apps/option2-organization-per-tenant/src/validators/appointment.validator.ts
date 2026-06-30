import { z } from 'zod';

const AppointmentStatusValues = [
  'proposed', 'pending', 'booked', 'arrived', 'fulfilled',
  'cancelled', 'noshow', 'entered-in-error', 'checked-in', 'waitlist',
] as const;

export const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1),
  practitionerId: z.string().min(1),
  start: z.string().datetime({ message: 'start must be an ISO 8601 datetime' }),
  end: z.string().datetime({ message: 'end must be an ISO 8601 datetime' }),
  status: z.enum(AppointmentStatusValues).optional(),
  description: z.string().max(500).optional(),
  serviceType: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
}).refine((d) => new Date(d.end) > new Date(d.start), {
  message: 'end must be after start',
  path: ['end'],
});

export const UpdateAppointmentSchema = z.object({
  patientId: z.string().min(1).optional(),
  practitionerId: z.string().min(1).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  status: z.enum(AppointmentStatusValues).optional(),
  description: z.string().max(500).optional(),
  serviceType: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

export const AppointmentSearchSchema = z.object({
  patientId: z.string().optional(),
  practitionerId: z.string().optional(),
  status: z.enum(AppointmentStatusValues).optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof UpdateAppointmentSchema>;
export type AppointmentSearchDto = z.infer<typeof AppointmentSearchSchema>;
