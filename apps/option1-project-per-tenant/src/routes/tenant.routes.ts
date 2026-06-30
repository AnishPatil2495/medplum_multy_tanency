import { Router } from 'express';

import { validateBody } from '@repo/shared';

import { TenantController } from '../controllers/tenant.controller';
import { CreateTenantSchema } from '../validators/tenant.validator';

export function createTenantRouter(controller: TenantController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/v1/tenants:
   *   post:
   *     summary: Register a new tenant (provisions a Medplum Project)
   *     tags: [Tenant]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, slug, adminEmail, adminPassword, adminFirstName, adminLastName]
   *             properties:
   *               name:
   *                 type: string
   *                 example: Acme Health
   *               slug:
   *                 type: string
   *                 example: acme-health
   *               adminEmail:
   *                 type: string
   *                 example: admin@acme.com
   *               adminPassword:
   *                 type: string
   *                 example: SecurePass123!
   *               adminFirstName:
   *                 type: string
   *                 example: John
   *               adminLastName:
   *                 type: string
   *                 example: Doe
   *     responses:
   *       201:
   *         description: Tenant created
   */
  router.post('/', validateBody(CreateTenantSchema), controller.register);

  return router;
}
