import { Request, Response, NextFunction } from 'express';
import { verifyRecaptchaToken } from '../services/recaptcha.service.js';
import type { ContactFormBody, OrderFormBody, RecaptchaVerificationResult } from '../types/FormRequestBodies.js';

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
  const token: string = req.body.captchaToken;
  const path: string = req.originalUrl;

  console.log('🔍 Received CAPTCHA token:', token);
  console.log('🧭 Full route seen by middleware:', path);

  if (!token) {
    res.status(400).json({ error: 'Missing CAPTCHA token' });
    return;
  }

  const expectedAction: string = actionMap[path];
  if (!expectedAction) {
    console.warn(`⚠️ No reCAPTCHA action mapping for path: ${path}`);
    res.status(400).json({ error: 'Unrecognized form submission route' });
    return;
  }

  const result: RecaptchaVerificationResult = await verifyRecaptchaToken(token, expectedAction);

  if (!result.success) {
    res.status(403).json({
      error: 'CAPTCHA failed',
      details: result.errorCodes,
    });
    return;
  }

  if (!result.isScoreAcceptable) {
    res.status(403).json({
      error: 'CAPTCHA score too low',
      score: result.score,
    });
    return;
  }

  if (!result.isActionValid) {
    res.status(400).json({
      error: 'CAPTCHA action mismatch',
      expected: expectedAction,
      actual: result.action,
    });
    return;
  }

  console.log('✅ reCAPTCHA passed. Proceeding to next handler.');
  next();
}
