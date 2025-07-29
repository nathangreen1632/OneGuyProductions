export async function verifyRecaptchaToken(token: string, expectedAction: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  console.log('🔍 Verifying reCAPTCHA:', { isProd, tokenExists: !!token, secretExists: !!secret });

  if (!secret) {
    console.warn('❌ RECAPTCHA_SECRET missing.');
    return false;
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

    console.log('🧠 reCAPTCHA response:', data);

    const isScoreAcceptable = data.success && (isProd ? data.score >= 0.5 : data.score >= 0.1);
    const isActionValid = data.action === expectedAction;

    if (!data.success) {
      console.warn('⚠️ CAPTCHA validation failed:', data['error-codes']);
      return false;
    }

    if (!isScoreAcceptable) {
      console.warn('⚠️ Low CAPTCHA score:', data.score);
      return false;
    }

    if (!isActionValid) {
      console.warn(`⚠️ CAPTCHA action mismatch: expected "${expectedAction}", got "${data.action}"`);
      // You may choose to reject here: return false;
    }

    return true;
  } catch (err) {
    console.error('🔥 CAPTCHA verification error:', err);
    return false;
  }
}
