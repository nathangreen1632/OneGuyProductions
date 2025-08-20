import type { OrderThreadDto } from '../../types/admin.types';
import type { OrderStatus } from '../../types/order.types';
import type {
  TAdminOrdersDataType,
  TAdminOrdersParamsType,
  TSafeFetchResultType,
} from '../../types/api.types';

const DEFAULT_TIMEOUT_MS = 20_000;

function normalizeText(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const raw: unknown = await res.json();
    const obj = (raw ?? {}) as Record<string, unknown>;

    const error: string = normalizeText(obj.error);
    const message: string = normalizeText(obj.message);

    let details: string = '';
    const d: unknown = obj.details;

    if (Array.isArray(d)) {
      details = d.map((x: any): string => String(x)).join(', ');
    } else if (typeof d === 'string') {
      details = d;
    } else if (d && typeof d === 'object') {
      try {
        details = Object.values(d as Record<string, unknown>)
          .map((x: unknown): string => String(x))
          .join(', ');
      } catch {

      }
    }

    const combined: string = [error, message, details].filter(Boolean).join(' — ').trim();
    if (combined) return combined;
  } catch {

  }

  try {
    const text = await res.text();
    if (text?.trim()) return text.trim();
  } catch {
    /* ignore */
  }

  const st: number = res.status;
  switch (st) {
    case 400: return 'Invalid request. Please check your inputs and try again.';
    case 401: return 'Not authenticated. Please sign in and try again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'Resource not found.';
    case 409: return 'Conflict detected. Please refresh and try again.';
    case 422: return 'Validation failed. Please review your inputs.';
    case 423: return 'Resource is locked and cannot be modified.';
    case 429: return 'Too many requests. Please slow down and try again.';
    case 500: return 'Server error. Please try again shortly.';
    case 503: return 'Service unavailable. Please try again shortly.';
    default:  return `Request failed (HTTP ${st}).`;
  }
}

async function safeFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<TSafeFetchResultType<T>> {
  const controller = new AbortController();
  const timer: number = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res: Response = await fetch(input, {
      credentials: 'include',
      ...init,
      signal: controller.signal,
    });

    if (!res.ok) {
      const msg: string = await parseErrorMessage(res);
      return { ok: false, error: msg };
    }

    let data: T | undefined;
    try {
      data = (await res.json()) as T;
    } catch {
      data = undefined as unknown as T;
    }

    return { ok: true, data };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'Request timed out. Please try again.' };
    }
    return { ok: false, error: 'Network error. Please check your connection.' };
  } finally {
    clearTimeout(timer);
  }
}

function assertPositiveInt(name: string, n: unknown): string | null {
  const v: number = Number(n);
  if (!Number.isFinite(v) || v <= 0) {
    return `${name} must be a positive number.`;
  }
  return null;
}

export async function fetchAdminOrders(
  params: TAdminOrdersParamsType
): Promise<TSafeFetchResultType<TAdminOrdersDataType>> {
  try {
    const qs = new URLSearchParams();

    const q: string = (params.q ?? '').toString().trim();
    if (q) qs.set('q', q);

    const status: string = (params.status ?? '').toString().trim();
    if (status && status !== 'all') qs.set('status', status);

    const assigned: string = (params.assigned ?? '').toString().trim();
    if (assigned && assigned !== 'any') qs.set('assigned', assigned);

    const updatedWithin: string = (params.updatedWithin ?? '').toString().trim();
    if (updatedWithin && updatedWithin !== 'all') qs.set('updatedWithin', updatedWithin);

    const page: number = Number(params.page ?? 1);
    const pageSize: number = Number(params.pageSize ?? 20);
    qs.set('page', Number.isFinite(page) && page > 0 ? String(page) : '1');
    qs.set('pageSize', Number.isFinite(pageSize) && pageSize > 0 ? String(pageSize) : '20');

    return await safeFetch<TAdminOrdersDataType>(`/api/admin/orders?${qs.toString()}`);
  } catch {
    return { ok: false, error: 'Failed to prepare request parameters.' };
  }
}

export async function fetchOrderThread(
  orderId: number
): Promise<TSafeFetchResultType<OrderThreadDto>> {
  const err: string | null = assertPositiveInt('orderId', orderId);
  if (err) return { ok: false, error: err };

  return await safeFetch<OrderThreadDto>(`/api/admin/orders/${orderId}/updates`);
}

export async function postAdminUpdate(
  orderId: number,
  payload: { body: string; requiresResponse: boolean }
): Promise<TSafeFetchResultType<void>> {
  const idErr: string | null = assertPositiveInt('orderId', orderId);
  if (idErr) return { ok: false, error: idErr };

  const body: string = (payload?.body ?? '').toString().trim();
  const requiresResponse: boolean = Boolean(payload?.requiresResponse);

  if (!body) {
    return { ok: false, error: 'Update body cannot be empty.' };
  }

  return await safeFetch<void>(`/api/admin/orders/${orderId}/updates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, requiresResponse }),
  });
}

export async function postOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<TSafeFetchResultType<void>> {
  const idErr: string | null = assertPositiveInt('orderId', orderId);
  if (idErr) return { ok: false, error: idErr };

  const s: string = (status as string) ?? '';
  if (!s) return { ok: false, error: 'Status is required.' };

  return await safeFetch<void>(`/api/admin/orders/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export async function postAssignOrder(
  orderId: number,
  adminUserId: number
): Promise<TSafeFetchResultType<void>> {
  const idErr: string | null = assertPositiveInt('orderId', orderId);
  if (idErr) return { ok: false, error: idErr };

  const adminErr: string | null = assertPositiveInt('adminUserId', adminUserId);
  if (adminErr) return { ok: false, error: adminErr };

  return await safeFetch<void>(`/api/admin/orders/${orderId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminUserId }),
  });
}
