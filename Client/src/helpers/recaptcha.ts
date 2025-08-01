export async function waitForRecaptcha(): Promise<void> {
  return new Promise((resolve: () => void): void => {
    const check: () => void = (): void => {
      if (
        typeof window !== 'undefined' &&
        window.grecaptcha &&
        typeof window.grecaptcha.execute === 'function'
      ) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };

    check();
  });
}
