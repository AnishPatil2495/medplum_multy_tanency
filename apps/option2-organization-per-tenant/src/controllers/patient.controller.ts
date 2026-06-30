import type { Request, Response, NextFunction } from 'express';

import { sendCreated, sendSuccess, sendNoContent, AppError } from '@repo/utils';

import { PatientOrgService } from '../services/patient.service';
import { requireOrganization } from '../middleware/tenant-resolver';
import type { CreatePatientDto, UpdatePatientDto, PatientSearchDto } from '../validators/patient.validator';

export class PatientOrgController {
  constructor(private readonly patientService: PatientOrgService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const dto = req.body as CreatePatientDto;
      const patient = await this.patientService.create(dto, req.medplumClient, org);
      sendCreated(res, patient);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const patient = await this.patientService.findById(req.params['id']!, req.medplumClient, org);
      sendSuccess(res, patient);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const dto = req.body as UpdatePatientDto;
      const patient = await this.patientService.update(req.params['id']!, dto, req.medplumClient, org);
      sendSuccess(res, patient);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      await this.patientService.delete(req.params['id']!, req.medplumClient, org);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const params = req.query as PatientSearchDto;
      const bundle = await this.patientService.search(params, req.medplumClient, org);
      sendSuccess(res, bundle);
    } catch (err) {
      next(err);
    }
  };
}
