export function loadRecaptcha(siteKey: string): void {
  if (typeof window === 'undefined') {
    console.warn('⚠️ reCAPTCHA: window is undefined (likely SSR)');
    return;
  }

  const existingScript: HTMLElement | null = document.getElementById('recaptcha-script');
  if (existingScript) {
    console.log('ℹ️ reCAPTCHA script already present.');
    return;
  }

  const script: HTMLScriptElement = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
  script.async = true;
  script.defer = true;

  script.onload = (): void => {
    console.log('✅ reCAPTCHA script loaded.');
    if (window.grecaptcha?.ready) {
      window.grecaptcha.ready(() => {
        console.log('✅ reCAPTCHA is ready.');
      });
    }
  };

  script.onerror = (): void => {
    console.error('❌ Failed to load reCAPTCHA script.');
  };

  document.body.appendChild(script);
}
