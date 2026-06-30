import { Router } from 'express';

import { createTenantRouter } from './tenant.routes';
import { createAuthRouter } from './auth.routes';
import { createPatientRouter } from './patient.routes';
import { createPractitionerRouter } from './practitioner.routes';
import { createAppointmentRouter } from './appointment.routes';
import type { Container } from '../utils/container';

export function createApiRouter(container: Container): Router {
  const api = Router();

  api.use('/tenants', createTenantRouter(container.tenantController));

  const tenanted = Router();
  tenanted.use(container.resolveTenant);
  tenanted.use('/auth', createAuthRouter(container.authController));
  tenanted.use('/patients', createPatientRouter(container.patientController));
  tenanted.use('/practitioners', createPractitionerRouter(container.practitionerController));
  tenanted.use('/appointments', createAppointmentRouter(container.appointmentController));

  api.use(tenanted);

  return api;
}
