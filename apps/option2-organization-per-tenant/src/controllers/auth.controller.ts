import type { Request, Response, NextFunction } from 'express';

import { sendCreated, sendSuccess, AppError } from '@repo/utils';

import { AuthOrgService } from '../services/auth.service';
import { requireTenantOrg } from '../middleware/tenant-resolver';
import type { RegisterUserDto, LoginDto } from '../validators/user.validator';

export class AuthOrgController {
  constructor(private readonly authService: AuthOrgService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = requireTenantOrg(req);
      const dto = req.body as RegisterUserDto;
      const user = await this.authService.register(dto, tenant.id);
      sendCreated(res, user);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = requireTenantOrg(req);
      const dto = req.body as LoginDto;
      const result = await this.authService.login(dto, tenant.id, tenant.slug);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      sendSuccess(res, req.user);
    } catch (err) {
      next(err);
    }
  };
}
