export async function waitForRecaptcha(): Promise<void> {
  return new Promise<void>((resolve) => {
    const check = (): void => {
      if (
        typeof window !== 'undefined' &&
        window.grecaptcha &&
        typeof window.grecaptcha.ready === 'function' &&
        typeof window.grecaptcha.execute === 'function'
      ) {
        console.log('✅ grecaptcha.ready and execute() are available.');
        resolve(); // No need to call grecaptcha.ready again
      } else {
        setTimeout(check, 50); // Poll every 50ms until both are available
      }
    };

    check();
  });
}
