import type { Request, Response, NextFunction } from 'express';

import { sendCreated, sendSuccess, sendNoContent, AppError } from '@repo/utils';

import { AppointmentOrgService } from '../services/appointment.service';
import { requireOrganization } from '../middleware/tenant-resolver';
import type { CreateAppointmentDto, UpdateAppointmentDto, AppointmentSearchDto } from '../validators/appointment.validator';

export class AppointmentOrgController {
  constructor(private readonly appointmentService: AppointmentOrgService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const dto = req.body as CreateAppointmentDto;
      const appointment = await this.appointmentService.create(dto, req.medplumClient, org);
      sendCreated(res, appointment);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const appointment = await this.appointmentService.findById(req.params['id']!, req.medplumClient, org);
      sendSuccess(res, appointment);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const dto = req.body as UpdateAppointmentDto;
      const appointment = await this.appointmentService.update(req.params['id']!, dto, req.medplumClient, org);
      sendSuccess(res, appointment);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      await this.appointmentService.delete(req.params['id']!, req.medplumClient, org);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = requireOrganization(req);
      if (!req.medplumClient) throw AppError.internal('Medplum client not initialized');
      const params = req.query as AppointmentSearchDto;
      const bundle = await this.appointmentService.search(params, req.medplumClient, org);
      sendSuccess(res, bundle);
    } catch (err) {
      next(err);
    }
  };
}
