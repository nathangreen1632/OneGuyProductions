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
