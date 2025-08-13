import type { OrderThreadDto } from '../../types/admin.types';
import type { OrderStatus } from '../../types/order.types';
import type { TAdminOrdersDataType, TAdminOrdersParamsType, TSafeFetchResultType } from '../../types/api.types';

async function safeFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<TSafeFetchResultType<T>> {
  try {
    const res: Response = await fetch(input, { credentials: 'include', ...init });

    if (!res.ok) {
      const errUnknown: unknown = await res.json().catch((): unknown => ({} as unknown));
      const errorText =
        typeof (errUnknown as any)?.error?.res?.statusText === 'string'
          ? (errUnknown as any).error.res.statusText
          : undefined;

      return { ok: false, error: errorText };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function fetchAdminOrders(
  params: TAdminOrdersParamsType
): Promise<TSafeFetchResultType<TAdminOrdersDataType>> {
  const qs = new URLSearchParams();

  if (params.q) qs.set('q', params.q);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.assigned && params.assigned !== 'any') qs.set('assigned', params.assigned);
  if (params.updatedWithin && params.updatedWithin !== 'all') qs.set('updatedWithin', params.updatedWithin);
  qs.set('page', String(params.page ?? 1));
  qs.set('pageSize', String(params.pageSize ?? 20));

  return safeFetch<TAdminOrdersDataType>(`/api/admin/orders?${qs.toString()}`);
}

export async function fetchOrderThread(
  orderId: number
): Promise<TSafeFetchResultType<OrderThreadDto>> {
  return safeFetch<OrderThreadDto>(`/api/admin/orders/${orderId}/updates`);
}

export async function postAdminUpdate(
  orderId: number,
  payload: { body: string; requiresResponse: boolean }
): Promise<TSafeFetchResultType<void>> {
  return safeFetch<void>(`/api/admin/orders/${orderId}/updates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function postOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<TSafeFetchResultType<void>> {
  return safeFetch<void>(`/api/admin/orders/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export async function postAssignOrder(
  orderId: number,
  adminUserId: number
): Promise<TSafeFetchResultType<void>> {
  return safeFetch<void>(`/api/admin/orders/${orderId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId }),
  });
}
