import pino from 'pino';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerOptions {
  level?: LogLevel;
  prettyPrint?: boolean;
  name?: string;
}

export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const { level = 'info', prettyPrint = process.env['NODE_ENV'] !== 'production', name } = options;

  const transport =
    prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined;

  return pino({
    level,
    name,
    transport,
    base: { service: name ?? 'app' },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  });
}

export const logger = createLogger({
  level: (process.env['LOG_LEVEL'] as LogLevel) ?? 'info',
  name: process.env['APP_NAME'] ?? 'medplum-poc',
});

export type Logger = pino.Logger;
