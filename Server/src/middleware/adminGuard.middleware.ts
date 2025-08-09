import type { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const roleOk = (req as any).user?.role === 'admin';
  const email: unknown = (req as any).user?.email;
  const emailOk = typeof email === 'string' && email.endsWith('@oneguyproductions.com');

  if (!roleOk || !emailOk) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
