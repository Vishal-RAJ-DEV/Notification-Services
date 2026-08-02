import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { connectDatabase } from '../config/db.js';
import { connectRedis } from '../config/redis.js';

export async function loaders(): Promise<void> {
  logger.info({ component: 'loaders' }, 'Starting loaders...');

  logger.info(
    { component: 'loaders', nodeEnv: env.NODE_ENV, serviceName: env.SERVICE_NAME },
    'Environment configuration loaded',
  );

  await connectDatabase();
  logger.info({ component: 'loaders' }, 'Database connected');

  await connectRedis();
  logger.info({ component: 'loaders' }, 'Redis connected');

  logger.info({ component: 'loaders' }, 'All loaders completed successfully');
}
