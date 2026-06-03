import { Request, Response, NextFunction } from 'express';

export function isAdmin(req: Request): boolean {
  return req.headers['x-admin-key'] === process.env.ADMIN_KEY;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) {
    return res.status(403).json({
      error: 'Unauthorized',
    });
  }

  next();
}
