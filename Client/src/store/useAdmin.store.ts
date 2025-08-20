import {create, type StoreApi, type UseBoundStore} from 'zustand';
import type {AdminOrderRowDto, OrderThreadDto} from '../types/admin.types.ts';
import type {OrderStatus} from '../types/order.types';
import {
  fetchAdminOrders,
  fetchOrderThread,
  postAdminUpdate,
  postAssignOrder,
  postOrderStatus,
} from '../helpers/api/adminApi';
import type {TAdminOrdersDataType, TSafeFetchResultType} from '../types/api.types.ts';

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

const LOG_PREFIX = 'useAdminStore';

function offlineHint(): string {
  try {
    return typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator).onLine === false
      ? ' You appear to be offline.'
      : '';
  } catch {
    return '';
  }
}

function extractReason(res: unknown): string | undefined {
  try {
    const r: any = res ?? {};
    if (typeof r === 'string') return r;
    if (typeof r?.error?.message === 'string' && r.error.message.trim()) return r.error.message;
    if (typeof r?.error === 'string' && r.error.trim()) return r.error;
    if (typeof r?.message === 'string' && r.message.trim()) return r.message;
    if (typeof r?.statusText === 'string' && r.statusText.trim()) return r.statusText;
  } catch {

  }
  return undefined;
}

function statusAware(defaultMsg: string, res?: { status?: number } | null): string {
  const status: number | undefined = typeof res?.status === 'number' ? res.status : undefined;
  if (status == null) return defaultMsg;
  if (status >= 500) return `Server error. ${defaultMsg}`;
  if (status === 429) return `Rate limited. ${defaultMsg}`;
  if (status === 404) return `Not found. ${defaultMsg}`;
  if (status === 401 || status === 403) return `Not authorized. ${defaultMsg}`;
  if (status === 400) return `Invalid request. ${defaultMsg}`;
  return defaultMsg;
}

function finalizeError(_prefix: string, baseMsg: string, res?: unknown): string {
  const reason: string | undefined = extractReason(res);

  let out: string = statusAware(
    baseMsg,
    (res as { status?: number } | null) ?? null
  );

  if (reason && reason.trim().length > 0) {
    out += ' (' + reason + ')';
  }
  out += offlineHint();
  return out;
}

function canPostByStatus(s: OrderStatus): boolean {
  return s !== 'cancelled' && s !== 'complete';
}

function safeNumber(n: unknown, fallback: number): number {
  const parsed: number = Number(n);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function synthesizeOrderFromRow(orderId: number, row?: AdminOrderRowDto) {
  try {
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
  } catch (err) {
    console.error(`${LOG_PREFIX}: synthesizeOrderFromRow failed`, err);
    return {
      id: orderId,
      status: 'pending',
      projectType: '',
      customerName: '',
      customerEmail: '',
      assignedAdminId: null,
      assignedAdminName: null,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    } as OrderThreadDto['order'];
  }
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
      const res: TSafeFetchResultType<TAdminOrdersDataType> = await fetchAdminOrders(params);
      const ok: boolean = !!res?.ok;
      const rows: AdminOrderRowDto[] = (ok && Array.isArray(res?.data?.rows)) ? res.data.rows : [];
      const total: number = ok && typeof res?.data?.total === 'number' ? res.data.total : rows.length;

      if (!ok) {
        const msg: string = finalizeError(LOG_PREFIX, 'Unable to load admin orders.', res);
        console.warn(`${LOG_PREFIX}: fetchList failed`, res);
        set({ rows, total, loading: false, lastError: msg });
        return;
      }

      set({ rows, total, loading: false, lastError: null });
    } catch (err) {
      console.error(`${LOG_PREFIX}: fetchList threw`, err);
      set({ rows: [], total: 0, loading: false, lastError: `Network or server error while loading admin orders.${offlineHint()}` });
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

    const findRow: (key: number) => AdminOrderRowDto | undefined = (key: number): AdminOrderRowDto | undefined =>
      get().rows.find((r: AdminOrderRowDto): boolean => r.id === key);

    const normalizeFromArray: (updatesUnknown: unknown[], key: number) => OrderThreadDto = (updatesUnknown: unknown[], key: number): OrderThreadDto => {
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
        updates: Array.isArray(updatesUnknown) ? (updatesUnknown as any[]) : [],
        canPost: canPostByStatus(synthesizedOrder.status),
      };
    };

    const normalizeFromObject: (obj: any, key: number) => OrderThreadDto = (obj: any, key: number): OrderThreadDto => {
      let updates: any[] = [];
      if (Array.isArray(obj?.updates)) updates = obj.updates;
      else if (Array.isArray(obj?.messages)) updates = obj.messages;

      const row: AdminOrderRowDto | undefined = findRow(key);
      const orderBlock: OrderThreadDto['order'] = obj?.order ?? synthesizeOrderFromRow(key, row);

      const canPost =
        typeof obj?.canPost === 'boolean' ? obj.canPost : canPostByStatus(orderBlock.status);

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
          lastError: finalizeError(LOG_PREFIX, 'Thread not available for this order yet.', res),
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
    } catch (err) {
      console.error(`${LOG_PREFIX}: fetchThread threw`, err);
      const row: AdminOrderRowDto | undefined = get().rows.find((r: AdminOrderRowDto): boolean => r.id === orderId);
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
        lastError: `Network or server error while loading the thread.${offlineHint()}`,
      }));
    }
  },

  async sendUpdate(orderId: number, body: string, requiresResponse: boolean): Promise<boolean> {
    try {
      const res: TSafeFetchResultType<void> = await postAdminUpdate(orderId, { body, requiresResponse });
      if (!res?.ok) {
        const msg: string = finalizeError(LOG_PREFIX, 'Failed to post update.', res);
        console.warn(`${LOG_PREFIX}: sendUpdate failed`, res);
        set({ lastError: msg });
        return false;
      }
      await get().fetchThread(orderId);
      return true;
    } catch (err) {
      console.error(`${LOG_PREFIX}: sendUpdate threw`, err);
      set({ lastError: `Network or server error while posting update.${offlineHint()}` });
      return false;
    }
  },

  async updateStatus(orderId: number, status: OrderStatus): Promise<boolean> {
    try {
      const res: TSafeFetchResultType<void> = await postOrderStatus(orderId, status);
      if (!res?.ok) {
        const msg: string = finalizeError(LOG_PREFIX, 'Failed to update order status.', res);
        console.warn(`${LOG_PREFIX}: updateStatus failed`, res);
        set({ lastError: msg });
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
    } catch (err) {
      console.error(`${LOG_PREFIX}: updateStatus threw`, err);
      set({ lastError: `Network or server error while updating status.${offlineHint()}` });
      return false;
    }
  },

  async assign(orderId: number, adminUserId: number): Promise<boolean> {
    try {
      const res: TSafeFetchResultType<void> = await postAssignOrder(orderId, adminUserId);
      if (!res?.ok) {
        const msg: string = finalizeError(LOG_PREFIX, 'Failed to assign order.', res);
        console.warn(`${LOG_PREFIX}: assign failed`, res);
        set({ lastError: msg });
        return false;
      }
      await get().fetchThread(orderId);
      return true;
    } catch (err) {
      console.error(`${LOG_PREFIX}: assign threw`, err);
      set({ lastError: `Network or server error while assigning order.${offlineHint()}` });
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
