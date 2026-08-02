import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

function createRedisClient(label: string): Redis {
  const connectionOptions: Redis.RedisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 100, 5000);
      logger.warn({ component: 'redis', label, attempt: times, delay }, 'Redis reconnecting');
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    lazyConnect: true,
  };

  if (env.NODE_ENV === 'production') {
    connectionOptions.tls = {};
  }

  const client = new Redis(connectionOptions);

  client.on('connect', () => {
    logger.info({ component: 'redis', label }, 'Redis client connecting');
  });

  client.on('ready', () => {
    logger.info({ component: 'redis', label }, 'Redis client ready');
  });

  client.on('error', (err: Error) => {
    logger.error({ component: 'redis', label, err }, 'Redis client error');
  });

  client.on('close', () => {
    logger.warn({ component: 'redis', label }, 'Redis client connection closed');
  });

  client.on('reconnecting', () => {
    logger.warn({ component: 'redis', label }, 'Redis client reconnecting');
  });

  client.on('end', () => {
    logger.warn({ component: 'redis', label }, 'Redis client connection ended');
  });

  return client;
}

export const redisClients = {
  queue: createRedisClient('bullmq-queue'),
  worker: createRedisClient('bullmq-worker'),
  events: createRedisClient('bullmq-events'),
  pubsub: createRedisClient('pubsub'),
};

export async function connectRedis(): Promise<void> {
  const connections = Object.entries(redisClients).map(async ([label, client]) => {
    try {
      await client.connect();
      logger.info({ component: 'redis', label }, `Redis client ${label} connected`);
    } catch (error) {
      logger.fatal({ component: 'redis', label, err: error }, `Failed to connect Redis client ${label}`);
      throw error;
    }
  });

  await Promise.all(connections);
}

export async function disconnectRedis(): Promise<void> {
  const disconnectPromises = Object.entries(redisClients).map(async ([label, client]) => {
    try {
      await client.quit();
      logger.info({ component: 'redis', label }, `Redis client ${label} disconnected`);
    } catch (error) {
      logger.error({ component: 'redis', label, err: error }, `Error disconnecting Redis client ${label}`);
    }
  });

  await Promise.all(disconnectPromises);
}
