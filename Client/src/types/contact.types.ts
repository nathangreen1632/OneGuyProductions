export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  captchaToken: string;
}

export interface ContactResponse {
  success: boolean;
  error?: string;
}

export function isLikelyEmail(s: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s);
}