import { logger } from '../config/logger.js';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, onRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      const jitter = Math.random() * delay * 0.1;
      const totalDelay = delay + jitter;

      logger.warn(
        { attempt, maxRetries, delay: totalDelay, err: error },
        'Retry attempt failed, retrying...',
      );

      if (onRetry) {
        onRetry(error as Error, attempt);
      }

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw new Error('Retry logic exhausted unexpectedly');
}
