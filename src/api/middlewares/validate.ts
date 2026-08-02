import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../../errors/ValidationError.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted: Record<string, string[]> = {};
        error.errors.forEach((issue) => {
          const path = issue.path.join('.');
          if (!formatted[path]) {
            formatted[path] = [];
          }
          formatted[path].push(issue.message);
        });
        next(new ValidationError(formatted));
      } else {
        next(error);
      }
    }
  };
}
