// =============================
// FORM BODY TYPES
// =============================

export interface ContactFormBody {
  captchaToken: string;
  name: string;
  email: string;
  message: string;
}

export interface OrderFormBody {
  captchaToken: string;
  name: string;
  email: string;
  businessName?: string;
  projectType: string;
  budget: string;
  timeline?: string;
  description: string;
}

// =============================
// ROUTE + REQUEST MAPPING TYPES
// =============================

export type KnownFormPaths = '/api/contact/submit' | '/api/order/submit';

export type RecaptchaRequestBody =
  | (ContactFormBody & { path: '/api/contact/submit' })
  | (OrderFormBody & { path: '/api/order/submit' });

// =============================
// RECAPTCHA VERIFICATION TYPES
// =============================

export type RecaptchaVerificationResult = {
  success: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  errorCodes?: string[];
  isActionValid: boolean;
  isScoreAcceptable: boolean;
};

export interface RecaptchaVerificationResponse {
  success: boolean;
  score: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  errorCodes: string[];
}
