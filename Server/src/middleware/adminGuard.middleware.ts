import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { EnvConfig } from '../config/env.config.js';

const jwtSecret: string = EnvConfig.JWT_SECRET as string;

interface DecodedJwtPayload {
  id: number;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const decoded: DecodedJwtPayload = jwt.verify(token, jwtSecret) as DecodedJwtPayload;
    const user: InstanceType<typeof User> | null = await User.findByPk(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    const emailOk: boolean = user.email.toLowerCase().endsWith('@oneguyproductions.com');

    if (!emailOk) {
      console.warn('Admin guard blocked user:', { id: user.id, email: user.email });
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    (req as any).user = { id: user.id, email: user.email };
    next();
  } catch (err: unknown) {
    console.error('requireAdmin failed:', err);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
