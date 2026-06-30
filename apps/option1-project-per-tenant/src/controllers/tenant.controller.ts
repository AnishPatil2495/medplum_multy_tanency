import type { Request, Response, NextFunction } from 'express';

import { sendCreated } from '@repo/utils';

import { TenantService } from '../services/tenant.service';
import type { CreateTenantDto } from '../validators/tenant.validator';

export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateTenantDto;
      const result = await this.tenantService.registerTenant(dto);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  };
}
