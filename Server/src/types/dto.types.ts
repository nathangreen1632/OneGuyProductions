export type OrderStatus = 'pending'|'in-progress'|'needs-feedback'|'complete'|'cancelled';

export interface OrderDto {
  id: number;
  name: string;
  email: string;
  businessName: string | null;
  projectType: string;
  budget: string;
  timeline: string | null;
  description: string;
  status: OrderStatus;
  assignedAdminId: number | null;
  createdAt: string;
  updatedAt: string;
  latestUpdateAt: string | null;
  lastReadAt: string | null;
  isUnread: boolean;
  unreadCount: number;
}

export interface OrderUpdateDto {
  id: number;
  orderId: number;
  authorUserId: number | null;
  body: string;
  source: 'web'|'email'|'system';
  eventType: 'comment'|'status'|'email';
  requiresCustomerResponse: boolean;
  createdAt: string;
}
