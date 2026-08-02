import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { loaders } from './loaders/index.js';
import { disconnectDatabase } from './config/db.js';
import { disconnectRedis } from './config/redis.js';
import { notificationWorker } from './workers/notification.worker.js';
import { notificationQueue } from './queues/notification.queue.js';

let server: ReturnType<typeof app.listen>;

async function start(): Promise<void> {
  try {
    await loaders();

    server = app.listen(env.PORT, () => {
      logger.info(
        {
          component: 'server',
          port: env.PORT,
          nodeEnv: env.NODE_ENV,
          pid: process.pid,
        },
        `Server started on port ${env.PORT}`,
      );
    });
  } catch (error) {
    logger.fatal({ component: 'server', err: error }, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ component: 'server', signal }, `${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info({ component: 'server' }, 'HTTP server closed');
    });
  }

  try {
    await notificationWorker.close();
    logger.info({ component: 'server' }, 'Notification worker closed');
  } catch (error) {
    logger.error({ component: 'server', err: error }, 'Error closing notification worker');
  }

  try {
    await notificationQueue.close();
    logger.info({ component: 'server' }, 'Notification queue closed');
  } catch (error) {
    logger.error({ component: 'server', err: error }, 'Error closing notification queue');
  }

  try {
    await disconnectRedis();
    logger.info({ component: 'server' }, 'Redis connections closed');
  } catch (error) {
    logger.error({ component: 'server', err: error }, 'Error disconnecting Redis');
  }

  try {
    await disconnectDatabase();
    logger.info({ component: 'server' }, 'Database connection closed');
  } catch (error) {
    logger.error({ component: 'server', err: error }, 'Error disconnecting database');
  }

  logger.info({ component: 'server' }, 'Graceful shutdown completed');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.fatal({ component: 'server', err: error }, 'Uncaught exception');
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ component: 'server', err: reason }, 'Unhandled promise rejection');
  shutdown('UNHANDLED_REJECTION');
});

start();
