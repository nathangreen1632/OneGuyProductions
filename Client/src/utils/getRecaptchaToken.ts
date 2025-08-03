import toast from 'react-hot-toast';

export async function getRecaptchaToken(
  action: string,
  siteKey: string
): Promise<string> {
  console.log('🧠 Starting token request for:', action);

  const grecaptcha = window.grecaptcha;

  if (!grecaptcha || typeof grecaptcha.execute !== 'function') {
    toast.error('reCAPTCHA is not available.');
    throw new Error('grecaptcha.execute is not available');
  }

  try {
    const token: string = await grecaptcha.execute(siteKey, { action });
    console.log('✅ Token received:', token);
    return token;
  } catch (err: unknown) {
    toast.error('Failed to execute reCAPTCHA.');
    console.error('❌ reCAPTCHA execute error:', err);
    throw err instanceof Error ? err : new Error('Unknown reCAPTCHA error');
  }
}
