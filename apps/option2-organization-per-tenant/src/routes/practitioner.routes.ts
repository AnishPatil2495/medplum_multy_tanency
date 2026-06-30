import { Router } from 'express';

import { validateBody, validateQuery, validateParams, requireAuth } from '@repo/shared';

import { PractitionerOrgController } from '../controllers/practitioner.controller';
import {
  CreatePractitionerSchema,
  UpdatePractitionerSchema,
  PractitionerSearchSchema,
} from '../validators/practitioner.validator';
import { IdParamSchema } from '../validators/patient.validator';
import config from '../config';

export function createPractitionerRouter(controller: PractitionerOrgController): Router {
  const router = Router();
  const auth = requireAuth(config.JWT_SECRET);
  router.post('/', auth, validateBody(CreatePractitionerSchema), controller.create);
  router.get('/', auth, validateQuery(PractitionerSearchSchema), controller.search);
  router.get('/:id', auth, validateParams(IdParamSchema), controller.getById);
  router.put('/:id', auth, validateParams(IdParamSchema), validateBody(UpdatePractitionerSchema), controller.update);
  router.delete('/:id', auth, validateParams(IdParamSchema), controller.delete);
  return router;
}
