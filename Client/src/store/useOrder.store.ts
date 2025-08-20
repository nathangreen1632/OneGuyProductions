import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { safeSet, safeGet, offlineHint, getStore } from '../helpers/zustandSafe.helper';
import type { Order, Order as TOrderType, OrderPayload, OrderPayload as TOrderPayloadType } from '../types/order.types';
import type { CustomerThread as TCustomerThreadType } from '../types/customer.types';

export interface TOrderStateType {
  lastOrder: TOrderPayloadType | null;
  setLastOrder: (order: TOrderPayloadType) => void;
  clearOrder: () => void;

  orders: TOrderType[];
  unreadOrderIds: number[];
  currentView: 'card' | 'timeline';
  initialized: boolean;

  fetchOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  markAsRead: (orderId: number) => void;
  setView: (view: 'card' | 'timeline') => void;
  updateOrder: (updated: TOrderType) => void;

  threadByOrderId?: Record<number, TCustomerThreadType>;
  threadLoading?: boolean;
  threadError?: string | null;

  fetchOrderThread?: (orderId: number) => Promise<void>;
  postOrderComment?: (orderId: number, body: string, requiresCustomerResponse?: boolean) => Promise<boolean>;
}

type TUnreadReadResultType = { exists: boolean; ids: number[] };

const LOG_PREFIX = 'useOrderStore';
const LOCAL_KEY: string = 'unreadOrderIds';

function normalizeIds(ids: unknown[]): number[] {
  if (!Array.isArray(ids)) return [];
  const out: number[] = [];
  for (const v of ids) {
    const n: number = Number(v);
    if (Number.isInteger(n) && n >= 0) out.push(n);
  }
  return out;
}

function readUnread(): TUnreadReadResultType {
  const store: Storage | null = getStore();
  if (!store) return { exists: false, ids: [] };
  try {
    const raw: string | null = store.getItem(LOCAL_KEY);
    if (raw === null) return { exists: false, ids: [] };
    const parsed = JSON.parse(raw) as unknown;
    return { exists: true, ids: normalizeIds(Array.isArray(parsed) ? parsed : []) };
  } catch (err) {
    console.warn(`${LOG_PREFIX}: unread parse failed, resetting`, err);
    return { exists: true, ids: [] };
  }
}

function saveUnread(ids: number[]): void {
  const store: Storage | null = getStore();
  if (!store) return;
  try {
    store.setItem(LOCAL_KEY, JSON.stringify(Array.isArray(ids) ? ids : []));
  } catch (err) {
    console.error(`${LOG_PREFIX}: saveUnread failed`, err);
  }
}

function validatePositiveId(id: unknown): number | null {
  const n: number = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    const txt: string = await res.text();
    if (txt.trim() === '') return null;
    try {
      return JSON.parse(txt) as unknown;
    } catch {
      return txt;
    }
  } catch (err) {
    console.error(`${LOG_PREFIX}: reading response body failed`, err);
    return null;
  }
}

function statusAware(base: string, res?: Response | null): string {
  const status: number | undefined = res?.status;
  if (typeof status !== 'number') return base;
  if (status >= 500) return `Server error. ${base}`;
  if (status === 429) return `Rate limited. ${base}`;
  if (status === 404) return `Not found. ${base}`;
  if (status === 401 || status === 403) return `Not authorized. ${base}`;
  if (status === 400) return `Invalid request. ${base}`;
  return base;
}

function finalizeError(baseMsg: string, res?: Response | null, extra?: string): string {
  let out: string = statusAware(baseMsg, res);
  if (extra?.trim()) out += ` (${extra.trim()})`;
  out += offlineHint();
  return out;
}

const orderStoreCreator: StateCreator<TOrderStateType> = (
  set: StoreApi<TOrderStateType>['setState'],
  get: () => TOrderStateType
): TOrderStateType => ({
  lastOrder: null,
  setLastOrder: (order: TOrderPayloadType): void => {
    try {
      const o: OrderPayload | null = order && typeof order === 'object' ? order : null;
      safeSet<TOrderStateType>(set, { lastOrder: o }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: setLastOrder threw`, err, { order });
    }
  },
  clearOrder: (): void => safeSet<TOrderStateType>(set, { lastOrder: null }, LOG_PREFIX),

  orders: [],
  unreadOrderIds: readUnread().ids,
  currentView: 'card',
  initialized: false,

  threadByOrderId: {},
  threadLoading: false,
  threadError: null,

  fetchOrders: async (): Promise<void> => {
    try {
      const res: Response = await fetch('/api/order/my-orders');
      const data: unknown = await readJsonSafe(res);

      if (!res.ok || !Array.isArray(data)) {
        const msg: string = finalizeError(
          'Unable to load your orders.',
          res,
          typeof data === 'string' ? data : undefined
        );
        console.warn(`${LOG_PREFIX}: fetchOrders failed`, { status: res.status, data, msg });
        return;
      }

      const incomingIds: number[] = normalizeIds(
        (data as TOrderType[]).map((order: TOrderType) => (order as unknown as { id: unknown }).id)
      );

      const storedRead: TUnreadReadResultType = readUnread();
      let unread: number[] = storedRead.ids;

      if (!get().initialized) {
        if (!storedRead.exists) unread = incomingIds;
        safeSet<TOrderStateType>(set, { initialized: true }, LOG_PREFIX);
      } else {
        unread = unread.filter((id: number): boolean => incomingIds.includes(id));
      }

      saveUnread(unread);

      safeSet<TOrderStateType>(
        set,
        { orders: data as TOrderType[], unreadOrderIds: unread },
        LOG_PREFIX
      );
    } catch (err) {
      console.error(`${LOG_PREFIX}: fetchOrders threw`, err);
    }
  },

  refreshOrders: async (): Promise<void> => {
    try {
      const res: Response = await fetch('/api/order/my-orders');
      const data: unknown = await readJsonSafe(res);

      if (!res.ok || !Array.isArray(data)) {
        const msg: string = finalizeError(
          'Unable to refresh your orders.',
          res,
          typeof data === 'string' ? data : undefined
        );
        console.warn(`${LOG_PREFIX}: refreshOrders failed`, { status: res.status, data, msg });
        return;
      }

      const incomingIds: number[] = normalizeIds(
        (data as TOrderType[]).map((order: TOrderType): unknown => (order as unknown as { id: unknown }).id)
      );
      const currentUnread: number[] = readUnread().ids;
      const trimmedUnread: number[] = currentUnread.filter((id: number): boolean => incomingIds.includes(id));
      saveUnread(trimmedUnread);

      safeSet<TOrderStateType>(
        set,
        { orders: data as TOrderType[], unreadOrderIds: trimmedUnread },
        LOG_PREFIX
      );
    } catch (err) {
      console.error(`${LOG_PREFIX}: refreshOrders threw`, err);
    }
  },

  markAsRead: (orderId: number): void => {
    try {
      const target: number | null = validatePositiveId(orderId);
      if (!target) return;

      const currentStored: number[] = readUnread().ids;
      const updated: number[] = currentStored.filter((id: number): boolean => id !== target);
      saveUnread(updated);

      safeSet<TOrderStateType>(set, { unreadOrderIds: updated }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: markAsRead threw`, err, { orderId });
    }
  },

  setView: (view: 'card' | 'timeline'): void => {
    try {
      const v: 'card' | 'timeline' = view === 'timeline' ? 'timeline' : 'card';
      safeSet<TOrderStateType>(set, { currentView: v }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: setView threw`, err, { view });
    }
  },

  updateOrder: (updated: TOrderType): void => {
    try {
      safeSet<TOrderStateType>(
        set,
        (state: TOrderStateType): { orders: Order[] } => {
          const next: Order[] = Array.isArray(state.orders)
            ? state.orders.map((o: Order): Order => (o?.id === (updated as any)?.id ? updated : o))
            : state.orders;
          return { orders: [...next] };
        },
        LOG_PREFIX
      );
    } catch (err) {
      console.error(`${LOG_PREFIX}: updateOrder threw`, err, { updated });
    }
  },

  fetchOrderThread: async (orderId: number): Promise<void> => {
    safeSet<TOrderStateType>(set, { threadLoading: true, threadError: null }, LOG_PREFIX);
    try {
      const id: number | null = validatePositiveId(orderId);
      if (!id) {
        safeSet<TOrderStateType>(set, { threadError: 'Invalid order id.', threadLoading: false }, LOG_PREFIX);
        return;
      }

      const res: Response = await fetch(`/api/order/${id}/updates`, { credentials: 'include' });
      const data: unknown = await readJsonSafe(res);

      if (!res.ok || !Array.isArray(data)) {
        const msg: string = finalizeError(
          'Unable to load conversation for this order.',
          res,
          typeof data === 'string' ? data : undefined
        );
        safeSet<TOrderStateType>(set, { threadError: msg, threadLoading: false }, LOG_PREFIX);
        return;
      }

      safeSet<TOrderStateType>(
        set,
        (s: TOrderStateType) => ({
          threadByOrderId: { ...(s.threadByOrderId ?? {}), [id]: data as TCustomerThreadType },
          threadLoading: false,
        }),
        LOG_PREFIX
      );

      try {
        get().markAsRead?.(id);
      } catch (err) {
        console.warn(`${LOG_PREFIX}: markAsRead after fetchOrderThread failed`, err);
      }
    } catch (err) {
      console.error(`${LOG_PREFIX}: fetchOrderThread threw`, err);
      safeSet<TOrderStateType>(
        set,
        { threadError: `Network error.${offlineHint()}`, threadLoading: false },
        LOG_PREFIX
      );
    }
  },

  postOrderComment: async (
    orderId: number,
    body: string,
    requiresCustomerResponse: boolean = false
  ): Promise<boolean> => {
    try {
      const id: number | null = validatePositiveId(orderId);
      if (!id) {
        safeSet<TOrderStateType>(set, { threadError: 'Invalid order id.' }, LOG_PREFIX);
        return false;
      }

      const res: Response = await fetch(`/api/order/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body, requiresCustomerResponse }),
      });

      if (!res.ok) {
        const errBody: unknown = await readJsonSafe(res);
        const reason: string =
          typeof errBody === 'string'
            ? errBody
            : (errBody as { error?: string; message?: string } | null)?.error ??
            (errBody as { error?: string; message?: string } | null)?.message ??
            '';
        const msg: string = finalizeError('Failed to post comment.', res, reason);
        safeSet<TOrderStateType>(set, { threadError: msg }, LOG_PREFIX);
        return false;
      }

      await safeGet(
        get,
        (s: TOrderStateType): Promise<void> | undefined => s.fetchOrderThread?.(id),
        Promise.resolve(),
        LOG_PREFIX
      );
      return true;
    } catch (err) {
      console.error(`${LOG_PREFIX}: postOrderComment threw`, err);
      safeSet<TOrderStateType>(set, { threadError: `Network error.${offlineHint()}` }, LOG_PREFIX);
      return false;
    }
  },
});

export const useOrderStore: UseBoundStore<StoreApi<TOrderStateType>> =
  create<TOrderStateType>(orderStoreCreator);
