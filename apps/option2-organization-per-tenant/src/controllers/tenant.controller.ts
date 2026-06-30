import type { Request, Response, NextFunction } from 'express';

import { sendCreated } from '@repo/utils';

import { TenantOrgService } from '../services/tenant.service';
import type { CreateTenantOrgDto } from '../validators/tenant.validator';

export class TenantOrgController {
  constructor(private readonly tenantService: TenantOrgService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateTenantOrgDto;
      const result = await this.tenantService.registerTenant(dto);
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  };
}
