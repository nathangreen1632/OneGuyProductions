import type { OrderStatus } from './order.types';

export interface AdminOrderRowDto {
  id: number;
  customerId: number | null;
  customerEmail: string;
  name: string;
  projectType: string;
  status: OrderStatus;
  assignedAdminId: number | null;
  assignedAdminName: string | null;

  lastUpdateAt: string | null;
  unreadCountForCustomer: number;
  ageHours: number;

  updatedAt?: string;
  latestUpdateAt?: string | null;
  unreadCount?: number;
}

export type UpdateSource = 'web' | 'email' | 'system';

export interface OrderUpdateDto {
  id: number;
  orderId: number;
  authorUserId: number;
  authorName: string;
  body: string;
  createdAt: string;
  source: UpdateSource;
  requiresResponse: boolean;
}

export interface OrderThreadDto {
  order: {
    id: number;
    status: OrderStatus;
    projectType: string;
    customerName: string;
    customerEmail: string;
    assignedAdminId: number | null;
    assignedAdminName: string | null;
    createdAt: string;
    updatedAt: string;
  };
  updates: OrderUpdateDto[];
  canPost: boolean;
}
