import { Router } from 'express';

import { validateBody, validateQuery, validateParams, requireAuth } from '@repo/shared';

import { PatientOrgController } from '../controllers/patient.controller';
import {
  CreatePatientSchema,
  UpdatePatientSchema,
  PatientSearchSchema,
  IdParamSchema,
} from '../validators/patient.validator';
import config from '../config';

export function createPatientRouter(controller: PatientOrgController): Router {
  const router = Router();
  const auth = requireAuth(config.JWT_SECRET);
  router.post('/', auth, validateBody(CreatePatientSchema), controller.create);
  router.get('/', auth, validateQuery(PatientSearchSchema), controller.search);
  router.get('/:id', auth, validateParams(IdParamSchema), controller.getById);
  router.put('/:id', auth, validateParams(IdParamSchema), validateBody(UpdatePatientSchema), controller.update);
  router.delete('/:id', auth, validateParams(IdParamSchema), controller.delete);
  return router;
}
