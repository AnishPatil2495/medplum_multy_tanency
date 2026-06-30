import { Router } from 'express';

import { validateBody, requireAuth } from '@repo/shared';

import { AuthOrgController } from '../controllers/auth.controller';
import { RegisterUserSchema, LoginSchema } from '../validators/user.validator';
import config from '../config';

export function createAuthRouter(controller: AuthOrgController): Router {
  const router = Router();
  router.post('/register', validateBody(RegisterUserSchema), controller.register);
  router.post('/login', validateBody(LoginSchema), controller.login);
  router.get('/me', requireAuth(config.JWT_SECRET), controller.me);
  return router;
}
