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
  lastError?: string | null; // optional, non-breaking

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

function canPostByStatus(s: OrderStatus): boolean {
  return s !== 'cancelled' && s !== 'complete';
}

function safeNumber(n: unknown, fallback: number): number {
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function synthesizeOrderFromRow(orderId: number, row?: AdminOrderRowDto) {
  const createdAt =
    row?.latestUpdateAt ??
    row?.lastUpdateAt ??
    row?.updatedAt ??
    new Date(0).toISOString();

  const updatedAt =
    row?.updatedAt ??
    row?.latestUpdateAt ??
    row?.lastUpdateAt ??
    createdAt;

  return {
    id: orderId,
    status: row?.status ?? 'pending',
    projectType: row?.projectType ?? '',
    customerName: row?.name ?? '',
    customerEmail: row?.customerEmail ?? '',
    assignedAdminId: row?.assignedAdminId ?? null,
    assignedAdminName: row?.assignedAdminName ?? null,
    createdAt,
    updatedAt,
  } as OrderThreadDto['order'];
}

export const useAdminStore: UseBoundStore<StoreApi<AdminState>> = create<AdminState>((set, get: () => AdminState) => ({
  rows: [],
  total: 0,
  loading: false,
  threads: {},
  lastError: null,

  async fetchList(params) {
    set({ loading: true, lastError: null });
    try {
      const res = await fetchAdminOrders(params);
      const ok = !!res?.ok;
      const rows = (ok && Array.isArray(res?.data?.rows)) ? res.data.rows : [];
      const total = ok && typeof res?.data?.total === 'number' ? res.data.total : rows.length;

      set({ rows, total, loading: false, lastError: ok ? null : 'Unable to load admin orders.' });
    } catch {
      set({ rows: [], total: 0, loading: false, lastError: 'Network or server error while loading admin orders.' });
    }
  },

  async fetchThread(orderId) {
    const id = safeNumber(orderId, 0);
    if (!id) {
      // create a minimal empty thread entry to avoid UI breakage
      set(s => ({ threads: { ...s.threads, [orderId]: { order: synthesizeOrderFromRow(0), updates: [], canPost: false } as OrderThreadDto }, lastError: 'Invalid order id.' }));
      return;
    }

    try {
      const res = await fetchOrderThread(id);

      if (!res?.ok || !res.data) {
        // fallback: synthesize minimal thread from any known list row
        const row = get().rows.find(r => r.id === id);
        const synthesized = synthesizeOrderFromRow(id, row);

        set(s => ({
          threads: { ...s.threads, [id]: { order: synthesized, updates: [], canPost: synthesized.status !== 'cancelled' && synthesized.status !== 'complete' } },
          lastError: 'Thread not available for this order yet.',
        }));
        return;
      }

      const raw: unknown = res.data;
      const numericKey = safeNumber((raw as any)?.order?.id ?? id, id);

      let normalized: OrderThreadDto;

      if (Array.isArray(raw)) {
        const updates = raw as unknown[];
        const row = get().rows.find(r => r.id === numericKey);

        const firstUpdateCreated =
          updates.length > 0 && typeof (updates[0] as any)?.createdAt === 'string'
            ? (updates[0] as any).createdAt
            : undefined;

        const createdAt =
          firstUpdateCreated ??
          row?.latestUpdateAt ??
          row?.lastUpdateAt ??
          row?.updatedAt ??
          new Date(0).toISOString();

        const updatedAt =
          row?.updatedAt ??
          row?.latestUpdateAt ??
          row?.lastUpdateAt ??
          createdAt;

        const synthesizedOrder = {
          id: numericKey,
          status: row?.status ?? 'pending',
          projectType: row?.projectType ?? '',
          customerName: row?.name ?? '',
          customerEmail: row?.customerEmail ?? '',
          assignedAdminId: row?.assignedAdminId ?? null,
          assignedAdminName: row?.assignedAdminName ?? null,
          createdAt,
          updatedAt,
        } as OrderThreadDto['order'];

        normalized = {
          order: synthesizedOrder,
          updates: updates as any[],
          canPost: synthesizedOrder.status !== 'cancelled' && synthesizedOrder.status !== 'complete',
        };
      } else {
        const obj = raw as any;
        const updates = Array.isArray(obj?.updates)
          ? obj.updates
          : Array.isArray(obj?.messages)
            ? obj.messages
            : [];

        const row = get().rows.find(r => r.id === numericKey);
        const orderBlock: OrderThreadDto['order'] = obj?.order ?? synthesizeOrderFromRow(numericKey, row);

        normalized = {
          ...obj,
          order: orderBlock,
          updates,
          canPost: typeof obj?.canPost === 'boolean'
            ? obj.canPost
            : (orderBlock.status !== 'cancelled' && orderBlock.status !== 'complete'),
        } as OrderThreadDto;
      }

      set(s => ({
        threads: { ...s.threads, [numericKey]: normalized },
        lastError: null,
      }));
    } catch {
      const row = get().rows.find(r => r.id === orderId);
      const synthesized = synthesizeOrderFromRow(orderId, row);

      set(s => ({
        threads: { ...s.threads, [orderId]: { order: synthesized, updates: [], canPost: synthesized.status !== 'cancelled' && synthesized.status !== 'complete' } },
        lastError: 'Network or server error while loading the thread.',
      }));
    }
  },

  async sendUpdate(orderId, body, requiresResponse) {
    try {
      const res = await postAdminUpdate(orderId, { body, requiresResponse });
      if (!res?.ok) {
        set({ lastError: 'Failed to post update.' });
        return false;
      }
      await get().fetchThread(orderId);
      return true;
    } catch {
      set({ lastError: 'Network or server error while posting update.' });
      return false;
    }
  },

  async updateStatus(orderId, status) {
    try {
      const res = await postOrderStatus(orderId, status);
      if (!res?.ok) {
        set({ lastError: 'Failed to update order status.' });
        return false;
      }

      set((s) => {
        const rows = Array.isArray(s.rows)
          ? s.rows.map((r) => (r.id === orderId ? { ...r, status } : r))
          : s.rows;

        const t = s.threads[orderId];
        const threads = t
          ? {
            ...s.threads,
            [orderId]: {
              ...t,
              order: { ...t.order, status },
              canPost: canPostByStatus(status),
            },
          }
          : s.threads;

        return { rows, threads, lastError: null };
      });

      void get().fetchThread(orderId);

      return true;
    } catch {
      set({ lastError: 'Network or server error while updating status.' });
      return false;
    }
  },

  async assign(orderId, adminUserId) {
    try {
      const res = await postAssignOrder(orderId, adminUserId);
      if (!res?.ok) {
        set({ lastError: 'Failed to assign order.' });
        return false;
      }
      await get().fetchThread(orderId);
      return true;
    } catch {
      set({ lastError: 'Network or server error while assigning order.' });
      return false;
    }
  },
}));

if (import.meta.env.DEV) {
  (window as any).__adm__ = {
    get state() { return useAdminStore.getState(); },
    get threads() { return useAdminStore.getState().threads; },
  };
}
