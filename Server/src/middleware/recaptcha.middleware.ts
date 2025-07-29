import { Request, Response, NextFunction } from 'express';
import { verifyRecaptchaToken } from '../services/recaptcha.service.js';

export async function recaptchaMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.body.captchaToken;
  console.log('🔍 Received CAPTCHA token:', token);

  const expectedAction = 'contact_form';
  console.log('🔐 Token received on backend:', token);
  if (!token) {
    res.status(400).json({ error: 'Missing CAPTCHA token' });
    return;
  }

  const isValid = await verifyRecaptchaToken(token, expectedAction);

  if (!isValid) {
    res.status(403).json({ error: 'CAPTCHA verification failed' });
    return;
  }

  next();
}
