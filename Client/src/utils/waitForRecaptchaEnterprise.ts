export async function waitForReCaptchaEnterpriseAndExecute(siteKey: string, action: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (window.grecaptcha?.enterprise?.ready) {
        window.grecaptcha.enterprise.ready(async () => {
          try {
            const token = await window.grecaptcha.enterprise.execute(siteKey, { action });
            resolve(token);
          } catch (err) {
            reject(err);
          }
        });
      } else {
        setTimeout(poll, 300);
      }
    };
    poll();
  });
}
