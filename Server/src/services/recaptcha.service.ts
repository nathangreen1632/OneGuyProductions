import { GoogleAuth } from 'google-auth-library';
import fs from 'fs/promises';
import type {
  RecaptchaVerificationResponse,
  RecaptchaVerificationResult,
} from '../types/FormRequestBodies.js';
import '../config/dotenv.js';

const PROJECT_ID: string = process.env.RECAPTCHA_PROJECT_ID || '';
const SITE_KEY: string = process.env.RECAPTCHA_SITE_KEY || '';
const MIN_SCORE: number = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');
const IS_PROD: boolean = process.env.NODE_ENV === 'production';

const SERVICE_ACCOUNT_KEY_PATH: string = process.env.SERVICE_ACCOUNT_KEY_PATH || '';

(async (): Promise<void> => {
  if (process.env.GOOGLE_CREDENTIALS_B64) {
    try {
      const buffer = Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, 'base64');
      await fs.writeFile(SERVICE_ACCOUNT_KEY_PATH, buffer, { mode: 0o600 });
    } catch (err) {
      console.error('❌ Failed to decode or write service account credentials to /tmp:', err);
    }
  } else {
    console.error('❌ GOOGLE_CREDENTIALS_B64 is not set. reCAPTCHA verification will fail.');
  }
})();

const auth = new GoogleAuth({
  keyFile: SERVICE_ACCOUNT_KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

export async function verifyRecaptchaToken(
  token: string,
  expectedAction: string
): Promise<RecaptchaVerificationResult> {
  const defaultResult: RecaptchaVerificationResult = {
    success: false,
    score: undefined,
    action: undefined,
    hostname: undefined,
    challenge_ts: undefined,
    errorCodes: [],
    isActionValid: false,
    isScoreAcceptable: false,
  };

  if (!token || !SITE_KEY || !PROJECT_ID) {
    console.warn('⚠️ reCAPTCHA verification skipped due to missing config:', {
      tokenProvided: !!token,
      siteKeySet: !!SITE_KEY,
      projectIdSet: !!PROJECT_ID,
    });
    return defaultResult;
  }

  try {
    const client = await auth.getClient();

    const { token: accessToken } = await client.getAccessToken() || {};
    if (!accessToken) {
      console.error('❌ Failed to acquire reCAPTCHA access token');
      return defaultResult;
    }

    const apiUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments`;

    const response: Response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          token,
          siteKey: SITE_KEY,
          expectedAction,
        },
      }),
    });

    if (!response.ok) {
      console.error('🚫 reCAPTCHA API responded with error:', {
        status: response.status,
        statusText: response.statusText,
      });
      return defaultResult;
    }

    const data: RecaptchaVerificationResponse = await response.json();

    const result: RecaptchaVerificationResult = {
      success: data.tokenProperties?.valid ?? false,
      score: data.riskAnalysis?.score,
      action: data.tokenProperties?.action,
      hostname: data.tokenProperties?.hostname,
      challenge_ts: data.tokenProperties?.createTime,
      errorCodes: data.tokenProperties?.invalidReason
        ? [data.tokenProperties.invalidReason]
        : [],
      isActionValid: data.tokenProperties?.action === expectedAction,
      isScoreAcceptable:
        (data.tokenProperties?.valid ?? false) &&
        (data.riskAnalysis?.score ?? 0) >= (IS_PROD ? MIN_SCORE : 0.1),
    };

    return result;
  } catch (err) {
    console.error('❌ Unexpected error during reCAPTCHA verification:', err);
    return defaultResult;
  }
}
