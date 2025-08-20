import toast from 'react-hot-toast';
import { getRecaptchaTokenHelper } from './getRecaptchaToken.helper.ts';
import { RECAPTCHA_SITE_KEY } from '../constants/env';

export async function executeRecaptchaFlow(action: string): Promise<string | null> {
  if (!RECAPTCHA_SITE_KEY) {
    console.error('reCAPTCHA: VITE_RECAPTCHA_SITE_KEY is missing.');
    toast.error('Security config missing. Please try again later.');
    return null;
  }

  if (
    typeof window === 'undefined' ||
    !window.grecaptcha?.enterprise ||
    typeof window.grecaptcha.enterprise.execute !== 'function'
  ) {
    toast.error('CAPTCHA is not ready yet.');
    return null;
  }

  try {
    return await getRecaptchaTokenHelper(action, RECAPTCHA_SITE_KEY);
  } catch {
    toast.error('CAPTCHA token failed. Please refresh and try again.');
    return null;
  }
}
