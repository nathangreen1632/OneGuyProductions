export interface OrderPayload {
  name: string;
  email: string;
  businessName: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  captchaToken: string;
}

export interface OrderFormData {
  name: string;
  email: string;
  businessName: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
}

export type DerivedOrderFormData = Omit<OrderPayload, 'captchaToken'>;

export interface OrderResponse {
  success: boolean;
  error?: string;
}
