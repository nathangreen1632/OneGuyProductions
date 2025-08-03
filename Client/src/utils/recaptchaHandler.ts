import toast from 'react-hot-toast';
import { waitForRecaptchaReady } from './loadRecaptcha';
import { getRecaptchaToken } from './getRecaptchaToken';

const RECAPTCHA_SITE_KEY: string = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export async function executeRecaptchaFlow(action: string): Promise<string | null> {
  console.log('🌀 Step 1: Waiting for grecaptcha...');
  try {
    await waitForRecaptchaReady();
    console.log('✅ Step 1 complete: grecaptcha is ready');
  } catch (err) {
    console.error('❌ Failed at Step 1 (waitForRecaptcha):', err);
    toast.error('CAPTCHA failed to initialize.');
    return null;
  }

  console.log('🌀 Step 2: Getting token...');
  try {
    const token = await getRecaptchaToken(action, RECAPTCHA_SITE_KEY);
    console.log('✅ Step 2 complete: Token retrieved');
    return token;
  } catch (err) {
    console.error('❌ Failed at Step 2 (getRecaptchaToken):', err);
    toast.error('CAPTCHA token failed. Please refresh and try again.');
    return null;
  }
}
