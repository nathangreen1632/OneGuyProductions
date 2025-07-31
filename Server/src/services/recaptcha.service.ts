type RecaptchaVerificationResult = {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  errorCodes?: string[];
  isActionValid: boolean;
  isScoreAcceptable: boolean;
};

export async function verifyRecaptchaToken(
  token: string,
  expectedAction: string
): Promise<RecaptchaVerificationResult> {
  const secret = process.env.RECAPTCHA_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  const result: RecaptchaVerificationResult = {
    success: false,
    score: undefined,
    action: undefined,
    hostname: undefined,
    challenge_ts: undefined,
    errorCodes: [],
    isActionValid: false,
    isScoreAcceptable: false,
  };

  console.log('🔍 Verifying reCAPTCHA:', {
    environment: isProd ? 'production' : 'development',
    tokenExists: !!token,
    secretExists: !!secret,
  });

  if (!secret) {
    console.warn('❌ Missing RECAPTCHA_SECRET in environment.');
    return result;
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    result.success = data.success;
    result.score = data.score;
    result.action = data.action;
    result.hostname = data.hostname;
    result.challenge_ts = data.challenge_ts;
    result.errorCodes = data['error-codes'] ?? [];

    result.isActionValid = data.action === expectedAction;
    result.isScoreAcceptable = data.success && (isProd ? data.score >= 0.5 : data.score >= 0.1);
    console.log('📊 Score:', data.score, '✅ Success:', data.success, '⚡️ Action:', data.action);

    console.log('🧠 Full reCAPTCHA response:', result);

    return result;
  } catch (err) {
    console.error('🔥 Error verifying reCAPTCHA token:', err);
    return result;
  }
}
