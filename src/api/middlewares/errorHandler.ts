import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/AppError.js';
import { ValidationError } from '../../errors/ValidationError.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      requestId: req.requestId,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      requestId: req.requestId,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  logger.error(
    {
      err,
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
    },
    'Unhandled error',
  );

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    requestId: req.requestId,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
