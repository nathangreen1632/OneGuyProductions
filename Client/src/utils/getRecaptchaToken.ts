// Client/src/utils/getRecaptchaToken.ts
import toast from 'react-hot-toast';

export async function getRecaptchaToken(
  action: string,
  siteKey: string
): Promise<string> {
  console.log('🧠 Starting reCAPTCHA enterprise token request for:', action);

  const grecaptcha = window.grecaptcha?.enterprise;

  if (!grecaptcha || typeof grecaptcha.execute !== 'function') {
    toast.error('reCAPTCHA Enterprise is not available.');
    throw new Error('grecaptcha.enterprise.execute is not available');
  }

  try {
    const token: string = await grecaptcha.execute(siteKey, { action });
    console.log('✅ Token received from reCAPTCHA Enterprise:', token);
    return token;
  } catch (err: unknown) {
    toast.error('Failed to generate reCAPTCHA token.');
    console.error('❌ reCAPTCHA Enterprise execute error:', err);
    throw err instanceof Error ? err : new Error('Unknown reCAPTCHA error');
  }
}
