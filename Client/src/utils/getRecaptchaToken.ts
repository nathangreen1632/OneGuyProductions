import toast from 'react-hot-toast';
import type {ReCaptchaEnterpriseV3} from '../types/grecaptcha';

export async function getRecaptchaToken(
  action: string,
  siteKey: string
): Promise<string> {
  const grecaptcha: ReCaptchaEnterpriseV3 | undefined = window.grecaptcha?.enterprise;

  if (!grecaptcha || typeof grecaptcha.execute !== 'function') {
    console.error('❌ grecaptcha.enterprise.execute is not available');
    toast.error('Security verification unavailable. Please try again later.');
    return '';
  }

  try {
    return await grecaptcha.execute(siteKey, {action});
  } catch (err: unknown) {
    console.error('❌ reCAPTCHA Enterprise execute error:', err);
    toast.error('Could not verify request. Please try again.');
    return '';
  }
}
