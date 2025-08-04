import { GoogleAuth } from 'google-auth-library';
import type {
  RecaptchaVerificationResponse,
  RecaptchaVerificationResult,
} from '../types/FormRequestBodies.js';
import '../config/dotenv.js';

const PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID || '';
const SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';
const MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
const IS_PROD = process.env.NODE_ENV === 'production';

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

  // Early exit if misconfigured
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
    console.log('🔐 GoogleAuth client acquired successfully');

    const { token: accessToken } = await client.getAccessToken() || {};

    if (!accessToken) {
      console.error('❌ Failed to acquire reCAPTCHA access token');
      return defaultResult;
    }

    const apiUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments`;

    const response = await fetch(apiUrl, {
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
    console.log('📥 Raw reCAPTCHA API response:', data);


    const result: RecaptchaVerificationResult = {
      success: data.tokenProperties?.valid ?? false,
      score: data.riskAnalysis?.score, // ✅ FIXED
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



    console.log('📊 reCAPTCHA verification result:', {
      success: result.success,
      score: result.score,
      action: result.action,
      isActionValid: result.isActionValid,
      isScoreAcceptable: result.isScoreAcceptable,
    });

    return result;
  } catch (err) {
    console.error('❌ Unexpected error during reCAPTCHA verification:', err);
    return defaultResult;
  }
}
