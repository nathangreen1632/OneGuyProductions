import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import {EnvConfig} from "../config/env.config.js";

const jwtSecret = EnvConfig.JWT_SECRET as string;

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: number };
    const user: User | null = await User.findByPk(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    const emailOk = user.email.toLowerCase().endsWith('@oneguyproductions.com');

    if (!emailOk) {
      // Optional, remove in prod
      console.warn('Admin guard blocked user:', { id: user.id, email: user.email });
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Attach for downstream handlers if needed
    (req as any).user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('requireAdmin failed:', err);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
