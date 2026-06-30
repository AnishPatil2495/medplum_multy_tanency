import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { Express, Router } from 'express';

import { createLogger } from '@repo/logger';

import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { createRateLimiter } from './middleware/rate-limiter';

const log = createLogger({ name: 'app-factory' });

export interface AppFactoryOptions {
  appName: string;
  corsOrigins: string | string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  swaggerSpec?: object;
  routers: Array<{ path: string; router: Router }>;
}

export function createExpressApp(options: AppFactoryOptions): Express {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: options.corsOrigins === '*' ? true : options.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
    }),
  );

  // Performance
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Observability
  app.use(requestLogger);

  // Rate limiting
  app.use(createRateLimiter(options.rateLimitWindowMs, options.rateLimitMax));

  // Health check (no auth needed)
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        app: options.appName,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  // Swagger UI
  if (options.swaggerSpec) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(options.swaggerSpec));
    log.info('Swagger UI available at /api-docs');
  }

  // Application routes
  for (const { path, router } of options.routers) {
    app.use(path, router);
    log.debug({ path }, 'Registered router');
  }

  // Error handling — must be last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
