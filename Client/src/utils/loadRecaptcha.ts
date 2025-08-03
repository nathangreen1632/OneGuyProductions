let initialized = false;

export function loadRecaptcha(siteKey: string): void {
  if (typeof window === 'undefined') return;

  const existingScript = document.getElementById('recaptcha-script');

  // ✅ Already initialized and executable
  if (initialized && window.grecaptcha?.execute) {
    console.log('✅ grecaptcha already initialized and executable.');
    return;
  }

  // ✅ Script present and executable
  if (existingScript && window.grecaptcha?.execute) {
    console.log('✅ grecaptcha script already present and executable.');
    initialized = true;
    return;
  }

  // 🆕 Insert new script
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('✅ grecaptcha script loaded.');
      window.grecaptcha?.ready?.(() => {
        initialized = true;
        console.log('✅ grecaptcha ready (onload).');
      });
    };

    script.onerror = () => {
      console.error('❌ Failed to load reCAPTCHA script.');
    };

    document.body.appendChild(script);
  } else {
    // ⚠️ Present but not yet ready — wait and try fallback
    console.log('⚠️ grecaptcha script tag exists but not executable yet.');
    window.grecaptcha?.ready?.(() => {
      initialized = true;
      console.log('✅ grecaptcha ready (from fallback).');
    });
  }
}

export async function waitForRecaptchaReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('❌ Timed out waiting for grecaptcha.ready()'));
    }, 6000);

    const check = (): void => {
      if (
        typeof window !== 'undefined' &&
        window.grecaptcha &&
        typeof window.grecaptcha.ready === 'function'
      ) {
        window.grecaptcha.ready(() => {
          clearTimeout(timeout);
          console.log('✅ grecaptcha.ready() resolved');
          resolve();
        });
      } else {
        setTimeout(check, 100);
      }
    };

    check();
  });
}
