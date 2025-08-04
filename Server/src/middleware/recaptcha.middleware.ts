// Server/src/middleware/recaptcha.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyRecaptchaToken } from '../services/recaptcha.service.js';
import type {
  ContactFormBody,
  OrderFormBody,
  RecaptchaVerificationResult,
} from '../types/FormRequestBodies.js';

type BodyWithCaptcha = ContactFormBody | OrderFormBody;

const actionMap: Record<string, string> = {
  '/api/contact/submit': 'submit_contact_form',
  '/api/order/submit': 'submit_order_form',
};

export async function recaptchaMiddleware(
  req: Request<{}, {}, BodyWithCaptcha>,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token: string = req.body?.captchaToken;
  const path: string = req.originalUrl;

  const expectedAction: string | undefined = actionMap[path];

  console.log('🧱 [reCAPTCHA] Middleware hit:', {
    route: path,
    tokenExists: !!token,
    expectedAction,
  });

  // 🔒 Basic token and path validation
  if (!token) {
    console.warn('⛔ Missing reCAPTCHA token');
    res.status(400).json({ error: 'Missing CAPTCHA token' });
    return;
  }

  if (!expectedAction) {
    console.warn('⚠️ No action mapping found for this path:', path);
    res.status(400).json({ error: 'Unrecognized form submission route' });
    return;
  }

  // 🔍 Token verification
  const result: RecaptchaVerificationResult = await verifyRecaptchaToken(token, expectedAction);

  // ❌ Validation failures
  if (!result.success) {
    console.warn('⛔ CAPTCHA verification failed:', result.errorCodes);
    res.status(403).json({
      error: 'CAPTCHA failed',
      details: result.errorCodes,
    });
    return;
  }

  if (!result.isScoreAcceptable) {
    console.warn('📉 Low CAPTCHA score:', result.score);
    res.status(403).json({
      error: 'CAPTCHA score too low',
      score: result.score,
    });
    return;
  }

  if (!result.isActionValid) {
    console.warn('⚠️ Action mismatch:', {
      expected: expectedAction,
      received: result.action,
    });
    res.status(400).json({
      error: 'CAPTCHA action mismatch',
      expected: expectedAction,
      actual: result.action,
    });
    return;
  }

  console.log('✅ reCAPTCHA verified successfully. Proceeding.');
  next();
}
