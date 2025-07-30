import { Request, Response, NextFunction } from 'express';
import { verifyRecaptchaToken } from '../services/recaptcha.service.js';

// Match full original URLs
const actionMap: Record<string, string> = {
  '/api/contact/submit': 'submit_contact_form',
  '/api/order/submit': 'submit_order_form',
};

export async function recaptchaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.body.captchaToken;
  const path = req.originalUrl; // ✅ Fix is here

  console.log('🔍 Received CAPTCHA token:', token);
  console.log('🧭 Full route seen by middleware:', path);

  if (!token) {
    res.status(400).json({ error: 'Missing CAPTCHA token' });
    return;
  }

  const expectedAction = actionMap[path];
  if (!expectedAction) {
    console.warn(`⚠️ No reCAPTCHA action mapping for path: ${path}`);
    res.status(400).json({ error: 'Unrecognized form submission route' });
    return;
  }

  console.log(`🔐 Verifying reCAPTCHA for action "${expectedAction}" on route "${path}"`);
  const result = await verifyRecaptchaToken(token, expectedAction);

  if (!result.success) {
    res.status(403).json({
      error: 'CAPTCHA failed',
      details: result.errorCodes,
    });
    return;
  }

  if (!result.isScoreAcceptable) {
    console.warn(`⚠️ CAPTCHA score too low: ${result.score}`);
    res.status(403).json({
      error: 'CAPTCHA score too low',
      score: result.score,
    });
    return;
  }

  if (!result.isActionValid) {
    console.warn(`⚠️ CAPTCHA action mismatch: expected "${expectedAction}", got "${result.action}"`);
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
