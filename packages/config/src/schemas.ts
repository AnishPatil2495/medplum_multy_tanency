import { z } from 'zod';

export const BaseAppConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  MEDPLUM_BASE_URL: z.string().url().default('http://localhost:8103'),
  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

export type BaseAppConfig = z.infer<typeof BaseAppConfigSchema>;

export const App1ConfigSchema = BaseAppConfigSchema.extend({
  APP_NAME: z.string().default('option1-project-per-tenant'),
  MEDPLUM_SUPER_ADMIN_CLIENT_ID: z.string(),
  MEDPLUM_SUPER_ADMIN_CLIENT_SECRET: z.string(),
  CLIENT_CACHE_TTL_MS: z.coerce.number().int().positive().default(300000),
});

export type App1Config = z.infer<typeof App1ConfigSchema>;

export const App2ConfigSchema = BaseAppConfigSchema.extend({
  APP_NAME: z.string().default('option2-organization-per-tenant'),
  MEDPLUM_PROJECT_ID: z.string(),
  MEDPLUM_CLIENT_ID: z.string(),
  MEDPLUM_CLIENT_SECRET: z.string(),
});

export type App2Config = z.infer<typeof App2ConfigSchema>;

export function parseConfig<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.output<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const errors = (result.error as z.ZodError).errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }
  return result.data as z.output<T>;
}
