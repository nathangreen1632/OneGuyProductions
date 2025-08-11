/** Common primitives */
export type ISODateString = string;

export type OrderStatus =
  | 'pending'
  | 'in-progress'
  | 'needs-feedback'
  | 'complete'
  | 'cancelled';

export type UpdateSource = 'web' | 'email' | 'system';
export type UpdateEventType = 'comment' | 'status' | 'email';

/** Minimal user surfaces used in UI */
export interface UserDto {
  id: number;
  username: string;
  email: string;
}

/**
 * Admin list row (what the AdminOrders table consumes).
 * Canonical keys reflect what your server emits NOW.
 * Optional keys cover older client expectations to avoid immediate breakage.
 */
export interface AdminOrderRowDto {
  id: number;
  customerId: number;
  customerEmail: string;
  name: string;               // customer name or order display name
  projectType: string;
  status: OrderStatus;

  assignedAdminId: number | null;

  /** Canonical - from server today */
  latestUpdateAt: ISODateString | null;

  /** Back-compat for older client lookups */
  lastUpdateAt?: ISODateString | null;

  /** Admin viewer unread count (canonical - server today) */
  unreadCount: number;

  /** Back-compat for portal/customer expectations */
  unreadCountForCustomer?: number;

  /** Row updatedAt (order.updatedAt), used for “Age” calc */
  updatedAt: ISODateString;

  /** Derived on server for the list page; hours since created/updated */
  ageHours: number;
}

/** Paginated admin list payload */
export interface AdminOrdersResponseDto {
  rows: AdminOrderRowDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** One timeline/update entry (matches your OrderUpdate model surface) */
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

/**
 * Thread used by AdminOrderDetail view:
 * Header-ish fields + ordered updates.
 * (Kept minimal to what is actually consumed by your UI today.)
 */
export interface OrderThreadDto {
  orderId: number;
  status: OrderStatus;
  projectType: string;

  customerId: number;
  customerEmail: string;
  customerName?: string | null;

  assignedAdminId: number | null;
  // Optional “nice to have” for header display if you add it server-side:
  assignedAdminName?: string | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;

  // Canonical + back-compat:
  latestUpdateAt: ISODateString | null;
  lastUpdateAt?: ISODateString | null;

  updates: OrderUpdateDto[];
}

/**
 * Minimal customer/portal order row (used in Customer Portal).
 * Included to centralize typing for the portal tables and detail card.
 * Only fields widely used across your portal components are included.
 */
export interface CustomerOrderDto {
  id: number;
  status: OrderStatus;
  projectType: string;

  businessName?: string | null;
  description?: string | null;
  timeline?: string | null;
  budget?: string | null;

  // Customer-facing unread count (some components use this name)
  unreadCountForCustomer?: number;

  // Canonical + back-compat:
  latestUpdateAt?: ISODateString | null;
  lastUpdateAt?: ISODateString | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * UI state shape for Admin order list filters & pagination.
 * Matches exactly what useAdminUiStore manages.
 */
export interface AdminUiState {
  /** Search query string */
  q: string;

  /** Filter by status or show all */
  status: OrderStatus | 'all';

  /** Filter by assignment */
  assigned: 'me' | 'any';

  /** Updated within time filter */
  updatedWithin: '24h' | '7d' | '30d' | 'all';

  /** Current page index (1-based) */
  page: number;

  /** Number of rows per page */
  pageSize: number;

  /** Whether auto-polling is enabled */
  polling: boolean;

  /** Generic setter */
  set: <K extends keyof AdminUiState>(k: K, v: AdminUiState[K]) => void;

  /** Reset all filters/pagination to defaults */
  reset: () => void;

  /** Explicit pagination setters */
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}
