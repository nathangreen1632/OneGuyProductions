import { Request, Response, NextFunction } from 'express';
import { verifyRecaptchaToken } from '../services/recaptcha.service.js';
import type {
  ContactFormBody,
  OrderFormBody,
  RecaptchaVerificationResult,
} from '../types/requestBodies.types.js';

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
  const token: string | undefined = req.body?.captchaToken;
  const path: string = req.originalUrl;
  const expectedAction: string | undefined = actionMap[path];

  if (!token) {
    console.warn('⚠️ CAPTCHA token missing from request body:', path);
    res.status(400).json({ error: 'Missing CAPTCHA token' });
    return;
  }

  if (!expectedAction) {
    console.error('❌ No expected CAPTCHA action mapped for path:', path);
    res.status(400).json({ error: 'Unrecognized form submission route' });
    return;
  }

  let result: RecaptchaVerificationResult;

  try {
    result = await verifyRecaptchaToken(token, expectedAction);
  } catch (err: unknown) {
    let message: string;

    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    } else {
      message = 'Unknown error during CAPTCHA verification';
    }

    console.error('❌ reCAPTCHA verification failed:', message);
    res.status(500).json({ error: 'CAPTCHA verification error', message });
    return;
  }

  if (!result.success) {
    console.warn('⚠️ CAPTCHA verification failed:', result.errorCodes);
    res.status(403).json({
      error: 'CAPTCHA failed',
      details: result.errorCodes,
    });
    return;
  }

  if (!result.isScoreAcceptable) {
    console.warn('⚠️ CAPTCHA score too low:', result.score);
    res.status(403).json({
      error: 'CAPTCHA score too low',
      score: result.score,
    });
    return;
  }

  if (!result.isActionValid) {
    console.warn('⚠️ CAPTCHA action mismatch:', {
      expected: expectedAction,
      actual: result.action,
    });
    res.status(400).json({
      error: 'CAPTCHA action mismatch',
      expected: expectedAction,
      actual: result.action,
    });
    return;
  }

  next();
}
