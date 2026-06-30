import { getPrismaClient } from '@repo/database';

import { TenantOrgRepository } from '../repositories/tenant.repository';
import { UserOrgRepository } from '../repositories/user.repository';
import { TenantOrgService } from '../services/tenant.service';
import { AuthOrgService } from '../services/auth.service';
import { PatientOrgService } from '../services/patient.service';
import { PractitionerOrgService } from '../services/practitioner.service';
import { AppointmentOrgService } from '../services/appointment.service';
import { TenantOrgController } from '../controllers/tenant.controller';
import { AuthOrgController } from '../controllers/auth.controller';
import { PatientOrgController } from '../controllers/patient.controller';
import { PractitionerOrgController } from '../controllers/practitioner.controller';
import { AppointmentOrgController } from '../controllers/appointment.controller';
import { tenantOrgResolver } from '../middleware/tenant-resolver';
import config from '../config';

export function buildContainer() {
  const db = getPrismaClient(config.DATABASE_URL);

  // Repositories
  const tenantRepo = new TenantOrgRepository(db);
  const userRepo = new UserOrgRepository(db);

  // Services
  const tenantService = new TenantOrgService(tenantRepo, userRepo);
  const authService = new AuthOrgService(userRepo);
  const patientService = new PatientOrgService();
  const practitionerService = new PractitionerOrgService();
  const appointmentService = new AppointmentOrgService();

  // Controllers
  const tenantController = new TenantOrgController(tenantService);
  const authController = new AuthOrgController(authService);
  const patientController = new PatientOrgController(patientService);
  const practitionerController = new PractitionerOrgController(practitionerService);
  const appointmentController = new AppointmentOrgController(appointmentService);

  // Middleware
  const resolveTenant = tenantOrgResolver(tenantRepo);

  return {
    db,
    tenantController,
    authController,
    patientController,
    practitionerController,
    appointmentController,
    resolveTenant,
  };
}

export type Container = ReturnType<typeof buildContainer>;
