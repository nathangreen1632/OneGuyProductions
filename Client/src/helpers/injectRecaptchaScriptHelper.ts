export function injectRecaptchaScriptHelper(siteKey: string): void {
  if (typeof window === 'undefined') return;

  const existingScript = document.getElementById('recaptcha-script');
  if (existingScript) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
  script.async = true;
  script.defer = true;

  script.onload = (): void => {
  };

  script.onerror = (): void => {
    console.error('❌ Failed to inject reCAPTCHA script');
  };

  document.body.appendChild(script);
}
