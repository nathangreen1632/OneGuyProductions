// ─────────────────────────────────────────────────────────────
// 📦 Order Types
// ─────────────────────────────────────────────────────────────

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
