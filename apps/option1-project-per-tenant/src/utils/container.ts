import { getPrismaClient } from '@repo/database';

import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { TenantService } from '../services/tenant.service';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { PractitionerService } from '../services/practitioner.service';
import { AppointmentService } from '../services/appointment.service';
import { TenantController } from '../controllers/tenant.controller';
import { AuthController } from '../controllers/auth.controller';
import { PatientController } from '../controllers/patient.controller';
import { PractitionerController } from '../controllers/practitioner.controller';
import { AppointmentController } from '../controllers/appointment.controller';
import { tenantResolver } from '../middleware/tenant-resolver';
import config from '../config';

/** Simple manual DI container — no framework overhead needed for a PoC */
export function buildContainer() {
  const db = getPrismaClient(config.DATABASE_URL);

  // Repositories
  const tenantRepo = new TenantRepository(db);
  const userRepo = new UserRepository(db);

  // Services
  const tenantService = new TenantService(tenantRepo, userRepo);
  const authService = new AuthService(userRepo);
  const patientService = new PatientService();
  const practitionerService = new PractitionerService();
  const appointmentService = new AppointmentService();

  // Controllers
  const tenantController = new TenantController(tenantService);
  const authController = new AuthController(authService);
  const patientController = new PatientController(patientService);
  const practitionerController = new PractitionerController(practitionerService);
  const appointmentController = new AppointmentController(appointmentService);

  // Middleware
  const resolveTenant = tenantResolver(tenantRepo);

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
