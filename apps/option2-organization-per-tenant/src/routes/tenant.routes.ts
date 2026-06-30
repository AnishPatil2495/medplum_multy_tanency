import { Router } from 'express';

import { validateBody } from '@repo/shared';

import { TenantOrgController } from '../controllers/tenant.controller';
import { CreateTenantOrgSchema } from '../validators/tenant.validator';

export function createTenantRouter(controller: TenantOrgController): Router {
  const router = Router();
  router.post('/', validateBody(CreateTenantOrgSchema), controller.register);
  return router;
}
