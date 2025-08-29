import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const wrap = (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => fn(req, res, next).catch(next);

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
}
