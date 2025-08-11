import type { AdminOrderRowDto, OrderThreadDto } from '../../types/admin.types';
import type { OrderStatus } from '../../types/order.types';

async function safeFetch<T>(input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res: Response = await fetch(input, { credentials: 'include', ...init });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as any));
      return { ok: false, error: (err.error?.res.statusText)};
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function fetchAdminOrders(params: {
  q?: string;
  status?: OrderStatus | 'all';
  assigned?: 'me' | 'any';
  updatedWithin?: '24h' | '7d' | '30d' | 'all';
  page?: number;
  pageSize?: number;
}): Promise<{ ok: boolean; data?: { rows: AdminOrderRowDto[]; total: number }; error?: string }> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.assigned && params.assigned !== 'any') qs.set('assigned', params.assigned);
  if (params.updatedWithin && params.updatedWithin !== 'all') qs.set('updatedWithin', params.updatedWithin);
  qs.set('page', String(params.page ?? 1));
  qs.set('pageSize', String(params.pageSize ?? 20));
  return safeFetch<{ rows: AdminOrderRowDto[]; total: number }>(`/api/admin/orders?${qs}`);
}

export async function fetchOrderThread(orderId: number): Promise<{ ok: boolean; data?: OrderThreadDto; error?: string }> {
  return safeFetch<OrderThreadDto>(`/api/admin/orders/${orderId}/updates`);
}

export async function postAdminUpdate(orderId: number, payload: { body: string; requiresResponse: boolean }): Promise<{ ok: boolean; error?: string }> {
  return safeFetch<void>(`/api/admin/orders/${orderId}/updates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function postOrderStatus(orderId: number, status: OrderStatus): Promise<{ ok: boolean; error?: string }> {
  return safeFetch<void>(`/api/admin/orders/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export async function postAssignOrder(orderId: number, adminUserId: number): Promise<{ ok: boolean; error?: string }> {
  return safeFetch<void>(`/api/admin/orders/${orderId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId }),
  });
}
