import { Router } from 'express';

import { validateBody, validateQuery, validateParams, requireAuth } from '@repo/shared';

import { AppointmentOrgController } from '../controllers/appointment.controller';
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  AppointmentSearchSchema,
} from '../validators/appointment.validator';
import { IdParamSchema } from '../validators/patient.validator';
import config from '../config';

export function createAppointmentRouter(controller: AppointmentOrgController): Router {
  const router = Router();
  const auth = requireAuth(config.JWT_SECRET);
  router.post('/', auth, validateBody(CreateAppointmentSchema), controller.create);
  router.get('/', auth, validateQuery(AppointmentSearchSchema), controller.search);
  router.get('/:id', auth, validateParams(IdParamSchema), controller.getById);
  router.put('/:id', auth, validateParams(IdParamSchema), validateBody(UpdateAppointmentSchema), controller.update);
  router.delete('/:id', auth, validateParams(IdParamSchema), controller.delete);
  return router;
}
