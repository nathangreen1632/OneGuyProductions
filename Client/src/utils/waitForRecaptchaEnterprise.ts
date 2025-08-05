export async function waitForReCaptchaEnterpriseAndExecute( siteKey: string, action: string): Promise<string> {
  return new Promise<string>((resolve: (value: string) => void, reject: (reason: Error) => void): void => {
    const poll: () => void = (): void => {
      if (window.grecaptcha?.enterprise?.ready) {
        window.grecaptcha.enterprise.ready(async (): Promise<void> => {
          try {
            const token: string = await window.grecaptcha.enterprise.execute(siteKey, { action });
            resolve(token);
          } catch (err: unknown) {
            let message: string;

            if (err instanceof Error) {
              message = err.message;
            } else if (typeof err === 'string') {
              message = err;
            } else {
              message = 'Unknown error during reCAPTCHA execution';
            }

            reject(new Error(message));
          }
        });
      } else {
        setTimeout(poll, 300);
      }
    };

    poll();
  });
}
