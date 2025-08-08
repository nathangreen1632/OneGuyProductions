// ─────────────────────────────────────────────────────────────
// 📦 Order Types
// ─────────────────────────────────────────────────────────────

import {OrderFormBody} from "./requestBodies.types.js";

export type OrderStatus =
  | 'pending'
  | 'in-progress'
  | 'needs-feedback'
  | 'complete'
  | 'cancelled';

export const validOrderStatuses: OrderStatus[] = [
  'pending',
  'in-progress',
  'needs-feedback',
  'complete',
  'cancelled',
];


export interface OrderAttributes {
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
  createdAt: string;
  updatedAt: string;
}

export interface OrderCreationAttributes
  extends Omit<OrderAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  status?: OrderStatus;
}

export interface OrderHandlingResult {
  dbSuccess: boolean;
  emailSuccess: boolean;
  orderId?: number; // ✅ NEW
}

export interface HandleOrderResult {
  dbSuccess: boolean;
  emailSuccess: boolean;
  orderId?: number; // Optional, as it may not be available if DB save fails
}

export interface NewOrderPayload extends OrderFormBody {
  customerId: number;
}