import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY_MS = 1000;

let retryCount = 0;

function getRetryDelay(): number {
  return Math.min(INITIAL_RETRY_DELAY_MS * 2 ** retryCount, 30000);
}

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => {
    logger.info({ component: 'mongodb' }, 'MongoDB connected successfully');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info({ component: 'mongodb' }, 'MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn({ component: 'mongodb' }, 'MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ component: 'mongodb', err }, 'MongoDB connection error');
  });

  mongoose.connection.on('close', () => {
    logger.info({ component: 'mongodb' }, 'MongoDB connection closed');
  });

  async function connectWithRetry(): Promise<void> {
    try {
      mongoose.set('strictQuery', true);
      await mongoose.connect(env.MONGO_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority',
      });
      retryCount = 0;
    } catch (error) {
      retryCount++;
      if (retryCount > MAX_RETRIES) {
        logger.fatal(
          { component: 'mongodb', retries: retryCount },
          'Failed to connect to MongoDB after maximum retries. Exiting.',
        );
        process.exit(1);
      }
      const delay = getRetryDelay();
      logger.error(
        { component: 'mongodb', retryCount, maxRetries: MAX_RETRIES, delay },
        'MongoDB connection failed, retrying...',
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectWithRetry();
    }
  }

  await connectWithRetry();
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
