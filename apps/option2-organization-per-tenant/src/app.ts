import path from 'path';

import swaggerJsdoc from 'swagger-jsdoc';
import { createExpressApp } from '@repo/shared';

import config from './config';
import { buildContainer } from './utils/container';
import { createApiRouter } from './routes';

export function createApp() {
  const container = buildContainer();

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Option 2 — Organization-per-Tenant API',
        version: '0.1.0',
        description:
          'All tenants share one Medplum Project. Each tenant is a FHIR Organization. ' +
          'All resources are automatically scoped by Organization. Pass X-Tenant-ID header.',
      },
      servers: [{ url: `http://localhost:${config.PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: [path.join(__dirname, 'routes', '*.js'), path.join(__dirname, 'routes', '*.ts')],
  });

  const app = createExpressApp({
    appName: config.APP_NAME,
    corsOrigins: config.CORS_ORIGINS,
    rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: config.RATE_LIMIT_MAX,
    swaggerSpec,
    routers: [{ path: '/api/v1', router: createApiRouter(container) }],
  });

  return { app, container };
}
