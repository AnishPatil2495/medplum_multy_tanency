import * as dotenv from 'dotenv';
import * as path from 'path';

export function loadEnv(envPath?: string): void {
  const resolvedPath = envPath ?? path.resolve(process.cwd(), '.env');
  dotenv.config({ path: resolvedPath });
}

export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}

export function getEnvNumber(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (raw === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: "${raw}"`);
  }
  return parsed;
}

export function getEnvBoolean(key: string, fallback?: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return raw.toLowerCase() === 'true' || raw === '1';
}
