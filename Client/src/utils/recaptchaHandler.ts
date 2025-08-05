import toast from 'react-hot-toast';
import {getRecaptchaToken} from './getRecaptchaToken';

const RECAPTCHA_SITE_KEY: string = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export async function executeRecaptchaFlow(action: string): Promise<string | null> {
  if (
    typeof window === 'undefined' ||
    !window.grecaptcha?.enterprise ||
    typeof window.grecaptcha.enterprise.execute !== 'function'
  ) {
    toast.error('CAPTCHA is not ready yet.');
    return null;
  }

  try {
    return await getRecaptchaToken(action, RECAPTCHA_SITE_KEY);
  } catch {
    toast.error('CAPTCHA token failed. Please refresh and try again.');
    return null;
  }
}
