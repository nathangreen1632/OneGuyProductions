// types/admin.types.ts

import type { OrderStatus } from './order.types';

export interface AdminOrderRowDto {
  id: number;
  customerId: number | null;          // server sometimes null
  customerEmail: string;
  name: string;
  projectType: string;
  status: OrderStatus;
  assignedAdminId: number | null;
  assignedAdminName: string | null;

  // existing legacy fields (keep)
  lastUpdateAt: string | null;
  unreadCountForCustomer: number;
  ageHours: number;

  // NEW (optional) — match /api/admin/orders payload you showed
  updatedAt?: string;                 // ISO
  latestUpdateAt?: string | null;     // ISO
  unreadCount?: number;               // server’s name
}

export type UpdateSource = 'web' | 'email' | 'system';

export interface OrderUpdateDto {
  id: number;
  orderId: number;
  authorUserId: number;
  authorName: string;
  body: string;
  createdAt: string;                  // ISO
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
    createdAt: string;                // keep required
    updatedAt: string;                // keep required
  };
  updates: OrderUpdateDto[];
  canPost: boolean;
}
