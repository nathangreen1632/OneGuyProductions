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
import type {TSafeFetchResultType} from "../types/api.types.ts";

interface AdminState {
  rows: AdminOrderRowDto[];
  total: number;
  loading: boolean;
  threads: Record<number, OrderThreadDto | undefined>;
  lastError?: string | null;

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
  const parsed: number = Number(n);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function synthesizeOrderFromRow(orderId: number, row?: AdminOrderRowDto) {
  const createdAt: string =
    row?.latestUpdateAt ??
    row?.lastUpdateAt ??
    row?.updatedAt ??
    new Date(0).toISOString();

  const updatedAt: string =
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

  async fetchList(params): Promise<void> {
    set({ loading: true, lastError: null });
    try {
      const res = await fetchAdminOrders(params);
      const ok: boolean = !!res?.ok;
      const rows: AdminOrderRowDto[] = (ok && Array.isArray(res?.data?.rows)) ? res.data.rows : [];
      const total: number = ok && typeof res?.data?.total === 'number' ? res.data.total : rows.length;

      set({ rows, total, loading: false, lastError: ok ? null : 'Unable to load admin orders.' });
    } catch {
      set({ rows: [], total: 0, loading: false, lastError: 'Network or server error while loading admin orders.' });
    }
  },

  async fetchThread(orderId: number): Promise<void> {
    const id: number = safeNumber(orderId, 0);
    if (!id) {
      set((s: AdminState) => ({
        threads: {
          ...s.threads,
          [orderId]: {
            order: synthesizeOrderFromRow(0),
            updates: [],
            canPost: false,
          } as OrderThreadDto,
        },
        lastError: 'Invalid order id.',
      }));
      return;
    }

    const findRow = (key: number): AdminOrderRowDto | undefined => get().rows.find((r: AdminOrderRowDto): boolean => r.id === key);

    const normalizeFromArray = (updatesUnknown: unknown[], key: number): OrderThreadDto => {
      const row: AdminOrderRowDto | undefined = findRow(key);

      let firstUpdateCreated: string | undefined;
      if (updatesUnknown.length > 0) {
        const first = updatesUnknown[0] as any;
        if (typeof first?.createdAt === 'string') firstUpdateCreated = first.createdAt;
      }

      const createdAt: string =
        firstUpdateCreated ??
        row?.latestUpdateAt ??
        row?.lastUpdateAt ??
        row?.updatedAt ??
        new Date(0).toISOString();

      const updatedAt: string =
        row?.updatedAt ??
        row?.latestUpdateAt ??
        row?.lastUpdateAt ??
        createdAt;

      const synthesizedOrder = {
        id: key,
        status: row?.status ?? 'pending',
        projectType: row?.projectType ?? '',
        customerName: row?.name ?? '',
        customerEmail: row?.customerEmail ?? '',
        assignedAdminId: row?.assignedAdminId ?? null,
        assignedAdminName: row?.assignedAdminName ?? null,
        createdAt,
        updatedAt,
      } as OrderThreadDto['order'];

      return {
        order: synthesizedOrder,
        updates: updatesUnknown as any[],
        canPost: canPostByStatus(synthesizedOrder.status),
      };
    };

    const normalizeFromObject: (obj: any, key: number) => OrderThreadDto = (obj: any, key: number): OrderThreadDto => {
      let updates: any[] = [];
      if (Array.isArray(obj?.updates)) {
        updates = obj.updates;
      } else if (Array.isArray(obj?.messages)) {
        updates = obj.messages;
      }

      const row: AdminOrderRowDto | undefined = findRow(key);
      const orderBlock: OrderThreadDto['order'] = obj?.order ?? synthesizeOrderFromRow(key, row);

      const canPost =
        typeof obj?.canPost === 'boolean'
          ? obj.canPost
          : canPostByStatus(orderBlock.status);

      return {
        ...obj,
        order: orderBlock,
        updates,
        canPost,
      } as OrderThreadDto;
    };

    try {
      const res: TSafeFetchResultType<OrderThreadDto> = await fetchOrderThread(id);

      if (!res?.ok || !res.data) {
        const row: AdminOrderRowDto | undefined = findRow(id);
        const synthesized = synthesizeOrderFromRow(id, row);

        set((s: AdminState) => ({
          threads: {
            ...s.threads,
            [id]: {
              order: synthesized,
              updates: [],
              canPost: canPostByStatus(synthesized.status),
            },
          },
          lastError: 'Thread not available for this order yet.',
        }));
        return;
      }

      const raw: unknown = res.data;
      const numericKey: number = safeNumber((raw as any)?.order?.id ?? id, id);

      const normalized: OrderThreadDto = Array.isArray(raw)
        ? normalizeFromArray(raw as unknown[], numericKey)
        : normalizeFromObject(raw as any, numericKey);

      set((s: AdminState) => ({
        threads: { ...s.threads, [numericKey]: normalized },
        lastError: null,
      }));
    } catch {
      const row: AdminOrderRowDto | undefined = get().rows.find((r) => r.id === orderId);
      const synthesized = synthesizeOrderFromRow(orderId, row);

      set((s: AdminState) => ({
        threads: {
          ...s.threads,
          [orderId]: {
            order: synthesized,
            updates: [],
            canPost: canPostByStatus(synthesized.status),
          },
        },
        lastError: 'Network or server error while loading the thread.',
      }));
    }
  },


  async sendUpdate(orderId: number, body: string, requiresResponse: boolean): Promise<boolean> {
    try {
      const res: TSafeFetchResultType<void> = await postAdminUpdate(orderId, { body, requiresResponse });
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

  async updateStatus(orderId:number, status: OrderStatus): Promise<boolean> {
    try {
      const res: TSafeFetchResultType<void> = await postOrderStatus(orderId, status);
      if (!res?.ok) {
        set({ lastError: 'Failed to update order status.' });
        return false;
      }

      set((s: AdminState) => {
        const rows: AdminOrderRowDto[] = Array.isArray(s.rows)
          ? s.rows.map((r: AdminOrderRowDto): AdminOrderRowDto => (r.id === orderId ? { ...r, status } : r))
          : s.rows;

        const t: OrderThreadDto | undefined = s.threads[orderId];
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

  async assign(orderId: number, adminUserId: number): Promise<boolean> {
    try {
      const res: TSafeFetchResultType<void> = await postAssignOrder(orderId, adminUserId);
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
    get state(): AdminState { return useAdminStore.getState(); },
    get threads() { return useAdminStore.getState().threads; },
  };
}
