import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import type { Order, OrderPayload } from '../types/order.types';

export interface TOrderStateType {
  lastOrder: OrderPayload | null;
  setLastOrder: (order: OrderPayload) => void;
  clearOrder: () => void;

  orders: Order[];
  unreadOrderIds: number[];
  currentView: 'card' | 'timeline';
  initialized: boolean;

  fetchOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  markAsRead: (orderId: number) => void;
  setView: (view: 'card' | 'timeline') => void;
  updateOrder: (updated: Order) => void;
}

const LOCAL_KEY: string = 'unreadOrderIds';

const storageWritable: (s: Storage) => boolean = (s: Storage): boolean => {
  try {
    const t = '__test__';
    s.setItem(t, '1');
    s.removeItem(t);
    return true;
  } catch {
    return false;
  }
};

const getStore: () => Storage | null = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  if (storageWritable(localStorage)) return localStorage;
  if (storageWritable(sessionStorage)) return sessionStorage;
  return null;
};

const normalizeIds: (ids: unknown[]) => number[] = (ids: unknown[]): number[] =>
  (ids ?? [])
    .map((v: unknown): number => Number(v))
    .filter((n: number): boolean => Number.isInteger(n) && n >= 0);

const loadUnread: () => number[] = (): number[] => {
  const store: Storage | null = getStore();
  if (!store) return [];
  try {
    const raw: string | null = store.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed: unknown[] = JSON.parse(raw) as unknown[];
    return normalizeIds(parsed);
  } catch {
    return [];
  }
};

const saveUnread: (ids: number[]) => void = (ids: number[]): void => {
  const store: Storage | null = getStore();
  if (!store) return;
  try {
    store.setItem(LOCAL_KEY, JSON.stringify(ids));
  } catch {}
};

const orderStoreCreator: StateCreator<TOrderStateType> = (
  set: StoreApi<TOrderStateType>['setState'],
  get: () => TOrderStateType
): TOrderStateType => ({
  lastOrder: null,
  setLastOrder: (order: OrderPayload): void => set({ lastOrder: order }),
  clearOrder: (): void => set({ lastOrder: null }),

  orders: [],
  unreadOrderIds: loadUnread(),
  currentView: 'card',
  initialized: false,

  fetchOrders: async (): Promise<void> => {
    try {
      const res: Response = await fetch('/api/order/my-orders');
      const data: unknown = await res.json();

      if (!Array.isArray(data)) {
        console.error('🚨 Unexpected response format in fetchOrders():', data);
        return;
      }

      const incomingIds: number[] = normalizeIds(
        (data as Order[]).map((order: Order): unknown => (order as unknown as { id: unknown }).id)
      );

      let unread: number[] = loadUnread();

      if (!get().initialized) {
        if (unread.length === 0) unread = incomingIds;
        set({ initialized: true });
      } else {
        unread = unread.filter((id: number): boolean => incomingIds.includes(id));
      }

      saveUnread(unread);

      set({
        orders: data as Order[],
        unreadOrderIds: unread,
      });
    } catch (err: unknown) {
      console.error('❌ Error in fetchOrders():', err);
    }
  },

  refreshOrders: async (): Promise<void> => {
    try {
      const res: Response = await fetch('/api/order/my-orders');
      const data: unknown = await res.json();

      if (!Array.isArray(data)) {
        console.error('🚨 Unexpected response format in refreshOrders():', data);
        return;
      }

      const incomingIds: number[] = normalizeIds(
        (data as Order[]).map((order: Order): unknown => (order as unknown as { id: unknown }).id)
      );
      const currentUnread: number[] = normalizeIds(get().unreadOrderIds as unknown as unknown[]);
      const trimmedUnread: number[] = currentUnread.filter((id: number): boolean =>
        incomingIds.includes(id)
      );
      saveUnread(trimmedUnread);

      set({ orders: data as Order[], unreadOrderIds: trimmedUnread });
    } catch (err: unknown) {
      console.error('❌ Error in refreshOrders():', err);
    }
  },

  markAsRead: (orderId: number): void =>
    set((state: TOrderStateType): Partial<TOrderStateType> => {
      const target: number = Number(orderId);
      const current: number[] = normalizeIds(state.unreadOrderIds as unknown as unknown[]);
      const updated: number[] = current.filter((id: number): boolean => id !== target);
      saveUnread(updated);
      return { unreadOrderIds: updated };
    }),

  setView: (view: 'card' | 'timeline'): void => set({ currentView: view }),

  updateOrder: (updated: Order): void =>
    set((state: TOrderStateType): Partial<TOrderStateType> => {
      const updatedOrders: Order[] = state.orders.map((o: Order): Order =>
        o.id === updated.id ? updated : o
      );
      return { orders: [...updatedOrders] };
    }),
});

export const useOrderStore: UseBoundStore<StoreApi<TOrderStateType>> =
  create<TOrderStateType>(orderStoreCreator);
