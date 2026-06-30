import { Router } from 'express';

import { validateBody, validateQuery, validateParams, requireAuth } from '@repo/shared';

import { PatientController } from '../controllers/patient.controller';
import {
  CreatePatientSchema,
  UpdatePatientSchema,
  PatientSearchSchema,
  IdParamSchema,
} from '../validators/patient.validator';
import config from '../config';

export function createPatientRouter(controller: PatientController): Router {
  const router = Router();
  const auth = requireAuth(config.JWT_SECRET);

  /**
   * @swagger
   * /api/v1/patients:
   *   post:
   *     summary: Create a patient in the tenant's Medplum project
   *     tags: [Patient]
   *   get:
   *     summary: Search patients
   *     tags: [Patient]
   */
  router.post('/', auth, validateBody(CreatePatientSchema), controller.create);
  router.get('/', auth, validateQuery(PatientSearchSchema), controller.search);

  /**
   * @swagger
   * /api/v1/patients/{id}:
   *   get:
   *     summary: Get patient by ID
   *     tags: [Patient]
   *   put:
   *     summary: Update patient
   *     tags: [Patient]
   *   delete:
   *     summary: Delete patient
   *     tags: [Patient]
   */
  router.get('/:id', auth, validateParams(IdParamSchema), controller.getById);
  router.put('/:id', auth, validateParams(IdParamSchema), validateBody(UpdatePatientSchema), controller.update);
  router.delete('/:id', auth, validateParams(IdParamSchema), controller.delete);

  return router;
}
