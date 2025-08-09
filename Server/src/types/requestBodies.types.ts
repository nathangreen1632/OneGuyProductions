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

export type KnownFormPaths = '/api/contact/submit' | '/api/order/submit';

export type RecaptchaRequestBody =
  | (ContactFormBody & { path: '/api/contact/submit' })
  | (OrderFormBody & { path: '/api/order/submit' });

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
  name: string;
  event?: unknown;
  tokenProperties: {
    valid: boolean;
    invalidReason?: string;
    hostname?: string;
    action?: string;
    createTime?: string;
  };
  riskAnalysis?: {
    score?: number;
    reasons?: string[];
  };
}

