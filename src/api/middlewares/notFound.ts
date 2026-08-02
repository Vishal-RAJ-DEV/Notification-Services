import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../../errors/NotFoundError.js';

export function notFoundHandler(_req: Request, _res: Response, _next: NextFunction): void {
  throw new NotFoundError(`Route ${_req.method} ${_req.originalUrl} not found`);
}
