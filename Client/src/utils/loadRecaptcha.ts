export function loadRecaptcha(siteKey: string): void {
  if (typeof window === 'undefined') return;

  const existingScript: HTMLElement | null = document.getElementById('recaptcha-script');
  if (existingScript) return;

  const script: HTMLScriptElement = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
}
