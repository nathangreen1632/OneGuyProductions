export type ISODateString = string;

export type OrderStatus =
  | 'pending'
  | 'in-progress'
  | 'needs-feedback'
  | 'complete'
  | 'cancelled';

export type UpdateSource = 'web' | 'email' | 'system';
export type UpdateEventType = 'comment' | 'status' | 'email';

export interface UserDto {
  id: number;
  username: string;
  email: string;
}

export interface AdminOrderRowDto {
  id: number;
  customerId: number;
  customerEmail: string;
  name: string;
  projectType: string;
  status: OrderStatus;
  assignedAdminId: number | null;
  latestUpdateAt: ISODateString | null;
  lastUpdateAt?: ISODateString | null;
  unreadCount: number;
  unreadCountForCustomer?: number;
  updatedAt: ISODateString;
  ageHours: number;
}

export interface AdminOrdersResponseDto {
  rows: AdminOrderRowDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderUpdateDto {
  id: number;
  orderId: number;
  authorUserId: number | null;
  body: string;
  source: UpdateSource;
  eventType: UpdateEventType;
  requiresCustomerResponse: boolean;
  editedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrderThreadDto {
  orderId: number;
  status: OrderStatus;
  projectType: string;
  customerId: number;
  customerEmail: string;
  customerName?: string | null;
  assignedAdminId: number | null;
  assignedAdminName?: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  latestUpdateAt: ISODateString | null;
  lastUpdateAt?: ISODateString | null;
  updates: OrderUpdateDto[];
}

export interface CustomerOrderDto {
  id: number;
  status: OrderStatus;
  projectType: string;
  businessName?: string | null;
  description?: string | null;
  timeline?: string | null;
  budget?: string | null;
  unreadCountForCustomer?: number;
  latestUpdateAt?: ISODateString | null;
  lastUpdateAt?: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
