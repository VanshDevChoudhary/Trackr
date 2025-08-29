import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const registerBody = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  name: z.string().optional(),
  deviceId: z.string().min(1),
});
