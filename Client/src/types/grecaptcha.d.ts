// src/types/grecaptcha.d.ts

export interface ReCaptchaV3 {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha: ReCaptchaV3;
  }
}

export {};
