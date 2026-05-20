import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-admin-key'];

  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      error: 'Unauthorized',
    });
  }

  next();
}
