// Client/src/utils/injectRecaptchaScript.ts
export function injectRecaptchaScript(siteKey: string): void {
  if (typeof window === 'undefined') return;

  const existingScript = document.getElementById('recaptcha-script');
  if (existingScript) {
    console.log('⚠️ reCAPTCHA script already injected');
    return;
  }

  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
  script.async = true;
  script.defer = true;

  script.onload = () => {
    console.log('✅ reCAPTCHA script injected and fully loaded');
  };

  script.onerror = () => {
    console.error('❌ Failed to inject reCAPTCHA script');
  };

  document.body.appendChild(script);
}
