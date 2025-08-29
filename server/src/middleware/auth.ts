import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error';

const JWT_SECRET = process.env.JWT_SECRET!;

interface TokenPayload {
  userId: string;
  deviceId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      deviceId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Missing auth token', 401));
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as TokenPayload;
    req.userId = payload.userId;
    req.deviceId = payload.deviceId;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
