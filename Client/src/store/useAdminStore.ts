import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { AdminOrderRowDto, OrderThreadDto } from '../types/admin.types.ts';
import type { OrderStatus } from '../types/order.types';
import {
  fetchAdminOrders,
  fetchOrderThread,
  postAdminUpdate,
  postOrderStatus,
  postAssignOrder,
} from '../helpers/api/adminApi';

interface AdminState {
  rows: AdminOrderRowDto[];
  total: number;
  loading: boolean;
  threads: Record<number, OrderThreadDto | undefined>;
  fetchList: (params: {
    q?: string;
    status?: OrderStatus | 'all';
    assigned?: 'me' | 'any';
    updatedWithin?: '24h' | '7d' | '30d' | 'all';
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  fetchThread: (orderId: number) => Promise<void>;
  sendUpdate: (orderId: number, body: string, requiresResponse: boolean) => Promise<boolean>;
  updateStatus: (orderId: number, status: OrderStatus) => Promise<boolean>;
  assign: (orderId: number, adminUserId: number) => Promise<boolean>;
}

// DEV-only logger
const __DEV__ = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;
function dlog(...args: unknown[]): void {
  if (__DEV__) console.debug('[adminStore]', ...args);
}

export const useAdminStore: UseBoundStore<StoreApi<AdminState>> = create<AdminState>((set, get: () => AdminState) => ({
  rows: [],
  total: 0,
  loading: false,
  threads: {},

  async fetchList(params) {
    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchList → params');
      console.debug(params);
      console.groupEnd();
    }

    set({ loading: true });
    const res = await fetchAdminOrders(params);

    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchList → response');
      console.debug('ok:', res?.ok, 'has data:', !!res?.data);
      if (res?.data) {
        console.debug('rows:', Array.isArray(res.data.rows) ? res.data.rows.length : 'n/a', 'total:', res.data.total);
        if (Array.isArray(res.data.rows) && res.data.rows.length > 0) {
          console.debug('first row sample:', res.data.rows[0]);
        }
      } else {
        console.debug('raw response:', res);
      }
      console.groupEnd();
    }

    if (res.ok && res.data) {
      set({ rows: res.data.rows, total: res.data.total, loading: false });
    } else {
      set({ loading: false });
    }
  },

  // ✅ Normalize thread keys; support array payloads by synthesizing minimal order
  async fetchThread(orderId) {
    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchThread → start');
      console.debug('orderId (arg):', orderId);
      console.groupEnd();
    }

    const res = await fetchOrderThread(orderId);

    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchThread → response');
      console.debug('ok:', res?.ok, 'has data:', !!res?.data);
      if (res?.data) {
        console.debug('raw payload (type):', Array.isArray(res.data) ? 'Array' : typeof res.data);
      } else {
        console.debug('raw response:', res);
      }
      console.groupEnd();
    }

    if (!res.ok || !res.data) {
      if (__DEV__) console.warn('[adminStore] fetchThread → non-ok or empty for', orderId, res);
      return;
    }

    const raw: any = res.data;
    const numericKey: number = Number((raw as any)?.order?.id ?? orderId);

    // 🔎 show raw before normalization
    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchThread → pre-normalize');
      console.debug('raw payload:', raw);
      console.groupEnd();
    }

    // ✅ normalize payload:
    // - If backend returns an array, treat it as "updates" and synthesize a minimal "order"
    //   from the list row so the header can render.
    // - If backend returns an object, prefer .updates, else map .messages, else [].
    let normalized: OrderThreadDto;

    // inside fetchThread, replace only the Array.isArray(raw) branch:

    if (Array.isArray(raw)) {
      const row = get().rows.find(r => r.id === numericKey);

      // derive timestamps safely
      const firstUpdateCreated =
        raw.length > 0 && typeof raw[0]?.createdAt === 'string' ? raw[0].createdAt : undefined;

      const createdAt =
        firstUpdateCreated ??
        row?.latestUpdateAt ??
        row?.lastUpdateAt ??
        row?.updatedAt ??                      // new optional
        new Date(0).toISOString();            // fallback (epoch)

      const updatedAt =
        row?.updatedAt ??
        row?.latestUpdateAt ??
        row?.lastUpdateAt ??
        createdAt;

      const synthesizedOrder: OrderThreadDto['order'] = {
        id: numericKey,
        status: row?.status ?? 'pending',     // sensible default
        projectType: row?.projectType ?? '',
        customerName: row?.name ?? '',
        customerEmail: row?.customerEmail ?? '',
        assignedAdminId: row?.assignedAdminId ?? null,
        assignedAdminName: row?.assignedAdminName ?? null,
        createdAt,
        updatedAt,
      };

      normalized = {
        order: synthesizedOrder,
        updates: raw,          // array from server
        canPost: synthesizedOrder.status !== 'cancelled' && synthesizedOrder.status !== 'complete',
      };
    } else {
      normalized = {
        ...raw,
        updates: Array.isArray(raw?.updates)
          ? raw.updates
          : Array.isArray(raw?.messages)
            ? raw.messages
            : [],
      } as OrderThreadDto;
    }


    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchThread → normalized');
      console.debug('key:', numericKey);
      console.debug('order.id:', (normalized as any)?.order?.id);
      console.debug('updates length:', Array.isArray((normalized as any)?.updates) ? (normalized as any).updates.length : 'n/a');
      console.debug('canPost:', (normalized as any)?.canPost);
      console.groupEnd();
    }

    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchThread → cache write');
      console.debug('normalized key:', numericKey);
      console.debug('existing (before):', get().threads[numericKey]);
      console.groupEnd();
    }

    set((s) => {
      const next = { ...s.threads } as Record<string | number, OrderThreadDto | undefined>;
      const strKey = String(numericKey);
      if (strKey in next) delete next[strKey];

      const updated: Record<number, OrderThreadDto | undefined> = {
        ...(next as Record<number, OrderThreadDto | undefined>),
        [numericKey]: normalized,
      };
      return { threads: updated };
    });

    if (__DEV__) {
      console.groupCollapsed('[adminStore] fetchThread → cache verify');
      const cached = get().threads[numericKey] as any;
      console.debug('threads keys:', Object.keys(get().threads));
      console.debug('cached order.id:', cached?.order?.id);
      console.debug('cached updates length:', Array.isArray(cached?.updates) ? cached.updates.length : 'n/a');
      console.groupEnd();
    }
  },

  async sendUpdate(orderId, body, requiresResponse) {
    if (__DEV__) dlog('sendUpdate →', { orderId, requiresResponse, bodyPreview: body?.slice?.(0, 120) });
    const res = await postAdminUpdate(orderId, { body, requiresResponse });
    if (!res.ok) {
      if (__DEV__) console.warn('[adminStore] sendUpdate → failed', res);
      return false;
    }
    await get().fetchThread(orderId);
    return true;
  },

  async updateStatus(orderId, status) {
    if (__DEV__) dlog('updateStatus →', { orderId, status });
    const res = await postOrderStatus(orderId, status);
    if (!res.ok) {
      if (__DEV__) console.warn('[adminStore] updateStatus → failed', res);
      return false;
    }
    await get().fetchThread(orderId);
    return true;
  },

  async assign(orderId, adminUserId) {
    if (__DEV__) dlog('assign →', { orderId, adminUserId });
    const res = await postAssignOrder(orderId, adminUserId);
    if (!res.ok) {
      if (__DEV__) console.warn('[adminStore] assign → failed', res);
      return false;
    }
    await get().fetchThread(orderId);
    return true;
  },
}));

// Dev helper (unchanged)
if (import.meta.env.DEV) {
  (window as any).__adm__ = {
    get state() { return useAdminStore.getState(); },
    get threads() { return useAdminStore.getState().threads; },
  };
}
