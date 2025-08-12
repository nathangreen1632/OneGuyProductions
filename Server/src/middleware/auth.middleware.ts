import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {EnvConfig} from "../config/env.config.js";

const jwtSecret = EnvConfig.JWT_SECRET as string;

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
