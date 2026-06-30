import { Router } from 'express';

import { validateBody, requireAuth } from '@repo/shared';

import { AuthController } from '../controllers/auth.controller';
import { RegisterUserSchema, LoginSchema } from '../validators/user.validator';
import config from '../config';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Register a user within the current tenant
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, firstName, lastName]
   *             properties:
   *               email: { type: string }
   *               password: { type: string }
   *               firstName: { type: string }
   *               lastName: { type: string }
   *               role: { type: string, enum: [admin, practitioner, patient, staff] }
   *     responses:
   *       201:
   *         description: User created
   */
  router.post('/register', validateBody(RegisterUserSchema), controller.register);

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Login and obtain JWT
   *     tags: [Auth]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: JWT token
   */
  router.post('/login', validateBody(LoginSchema), controller.login);

  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     summary: Get current user info
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Current user
   */
  router.get('/me', requireAuth(config.JWT_SECRET), controller.me);

  return router;
}
