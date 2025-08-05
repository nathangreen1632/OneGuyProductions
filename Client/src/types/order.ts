// ─────────────────────────────────────────────────────────────
// 📦 FORM + SUBMISSION TYPES (for OrderForm / POST payload)
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// 🧠 CUSTOMER PORTAL TYPES (used in Zustand + rendering)
// ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'in-progress'
  | 'needs-feedback'
  | 'complete'
  | 'cancelled';

export interface OrderUpdateEntry {
  user: string;           // engineer or customer making the change
  timestamp: string;      // ISO format
  message: string;        // description of what changed
}

export interface Order {
  id: number;
  customerId: number;
  name: string;
  email: string;
  businessName: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  status: OrderStatus;
  createdAt: string;        // ISO format timestamp
  updatedAt: string;        // ISO format timestamp
  updates: OrderUpdateEntry[];
}
