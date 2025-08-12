export type OrderStatus =
  | 'pending'
  | 'in-progress'
  | 'needs-feedback'
  | 'complete'
  | 'cancelled';

export interface AdminOrderRow {
  id: number;
  customerId: number;
  customerEmail: string;
  name: string;
  projectType: string;
  status: OrderStatus;
  assignedAdminId: number | null;
  updatedAt: string;
  latestUpdateAt: string | null;
  unreadCount: number;
  ageHours: number;
}

export interface AdminOrdersResponse {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
}
