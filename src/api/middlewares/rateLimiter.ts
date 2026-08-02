import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/AppError.js';

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(options: RateLimiterOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + options.windowMs };
      store.set(key, record);
    }

    record.count++;

    if (record.count > options.maxRequests) {
      next(
        new AppError('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED'),
      );
      return;
    }

    next();
  };
}

export function resetRateLimiterStore(): void {
  store.clear();
}
