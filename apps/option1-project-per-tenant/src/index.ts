import { createLogger } from '@repo/logger';
import { disconnectPrisma } from '@repo/database';

import config from './config';
import { createApp } from './app';

const log = createLogger({ name: config.APP_NAME });

async function main() {
  const { app } = createApp();

  const server = app.listen(config.PORT, config.HOST, () => {
    log.info(
      {
        port: config.PORT,
        host: config.HOST,
        env: config.NODE_ENV,
        docs: `http://${config.HOST}:${config.PORT}/api-docs`,
      },
      `${config.APP_NAME} listening`,
    );
  });

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'Shutdown signal received');
    server.close(async () => {
      await disconnectPrisma();
      log.info('Server closed cleanly');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
