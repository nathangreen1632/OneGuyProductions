// ─────────────────────────────────────────────────────────────
// 📦 FORM & SUBMISSION TYPES (OrderForm → POST payload/response)
// ─────────────────────────────────────────────────────────────

export interface OrderFormData {
  name: string;
  email: string;
  businessName: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
}

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

/** Convenience alias: form data with the CAPTCHA token added server-side */
export type DerivedOrderFormData = Omit<OrderPayload, 'captchaToken'>;

export interface OrderResponse {
  success: boolean;
  error?: string; // Optional error message if success is false
  message: string;
  orderId: number;
  unknownEmail: boolean;
}

// ─────────────────────────────────────────────────────────────
// 🧠 CUSTOMER PORTAL DOMAIN TYPES (Zustand + rendering)
// ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'in-progress'
  | 'needs-feedback'
  | 'complete'
  | 'cancelled';

export interface OrderUpdateEntry {
  /** Engineer or customer making the change */
  user: string;
  /** ISO timestamp */
  timestamp: string;
  /** Description of what changed */
  message: string;
}

export interface Order {
  // IDs
  id: number;
  customerId: number;

  // Customer & project info
  name: string;
  email: string;
  businessName: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;

  // Status & meta
  status: OrderStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  updates: OrderUpdateEntry[];
}

export type OrderState = {
  orders: Order[];
  unreadOrderIds: number[];
  markAsRead: (id: number) => void;
  updateOrder: (order: Order) => void;
};

// ─────────────────────────────────────────────────────────────
// DTO for order updates (returned from server for admin timeline)
// ─────────────────────────────────────────────────────────────
export interface OrderUpdateDto {
  id: number;
  authorName: string;
  source: string; // e.g., 'admin', 'customer', 'system'
  createdAt: string; // ISO date string from the backend
  body: string; // raw HTML-safe string
  requiresResponse: boolean;
}
