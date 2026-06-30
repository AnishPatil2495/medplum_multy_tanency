import type { Request, Response, NextFunction } from 'express';

import { sendCreated, sendSuccess, sendNoContent, AppError } from '@repo/utils';

import { PractitionerOrgService } from '../services/practitioner.service';
import { requireOrganization } from '../middleware/tenant-resolver';
import type { CreatePractitionerDto, UpdatePractitionerDto } from '../validators/practitioner.validator';

export class PractitionerOrgController {
  constructor(private readonly practitionerService: PractitionerOrgService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const dto = req.body as CreatePractitionerDto;
      const result = await this.practitionerService.create(dto, req.medplumClient, org);
      sendCreated(res, result.practitioner);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const practitioner = await this.practitionerService.findById(req.params['id']!, req.medplumClient, org);
      sendSuccess(res, practitioner);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const dto = req.body as UpdatePractitionerDto;
      const practitioner = await this.practitionerService.update(req.params['id']!, dto, req.medplumClient, org);
      sendSuccess(res, practitioner);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      await this.practitionerService.delete(req.params['id']!, req.medplumClient, org);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const params = req.query as { name?: string; email?: string; page?: number; pageSize?: number };
      const bundle = await this.practitionerService.search(params, req.medplumClient, org);
      sendSuccess(res, bundle);
    } catch (err) {
      next(err);
    }
  };
}
