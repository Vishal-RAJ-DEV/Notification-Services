import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger.js';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    res.responseTime = duration;

    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: duration,
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      'request completed',
    );
  });

  next();
}
