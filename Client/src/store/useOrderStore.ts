import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import type { Order, OrderPayload } from '../types/order.types';

export interface TOrderStateType {
  lastOrder: OrderPayload | null;
  setLastOrder: (order: OrderPayload) => void;
  clearOrder: () => void;

  orders: Order[];
  unreadOrderIds: number[];
  currentView: 'card' | 'timeline';

  fetchOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  markAsRead: (orderId: number) => void;
  setView: (view: 'card' | 'timeline') => void;
  updateOrder: (updated: Order) => void;
}

const LOCAL_KEY: string = 'unreadOrderIds';

const storageAvailable: () => boolean = (): boolean => {
  try {
    const t = '__test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
};

const loadUnread: () => number[] = (): number[] => {
  if (!storageAvailable()) return [];
  try {
    const stored: string | null = localStorage.getItem(LOCAL_KEY);
    return stored ? (JSON.parse(stored) as number[]) : [];
  } catch {
    return [];
  }
};

const saveUnread: (ids: number[]) => void = (ids: number[]): void => {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  } catch {}
};

const getBaselineUnread: (stored: number[], inMemory: number[], incoming: number[]) => number[] = (
  stored: number[],
  inMemory: number[],
  incoming: number[]
): number[] => {
  if (stored.length) return stored;
  if (inMemory.length) return inMemory;
  return incoming;
};

const orderStoreCreator: StateCreator<TOrderStateType> = (set, get: () => TOrderStateType) => ({
  lastOrder: null,
  setLastOrder: (order: OrderPayload): void => set({ lastOrder: order }),
  clearOrder: (): void => set({ lastOrder: null }),

  orders: [],
  unreadOrderIds: loadUnread(),
  currentView: 'card',

  fetchOrders: async (): Promise<void> => {
    try {
      const res: Response = await fetch('/api/order/my-orders');
      const data: unknown = await res.json();

      if (!Array.isArray(data)) {
        console.error('🚨 Unexpected response format in fetchOrders():', data);
        return;
      }

      const incomingIds: number[] = (data as Order[]).map((order: Order): number => order.id);
      const stored: number[] = loadUnread();
      const inMemory: number[] = get().unreadOrderIds;
      const baseline: number[] = getBaselineUnread(stored, inMemory, incomingIds);
      const finalUnread: number[] = baseline.filter((id: number): boolean => incomingIds.includes(id));

      saveUnread(finalUnread);

      set({
        orders: data as Order[],
        unreadOrderIds: finalUnread,
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

      const incomingIds: number[] = (data as Order[]).map((order: Order): number => order.id);
      const trimmedUnread: number[] = get().unreadOrderIds.filter((id: number): boolean =>
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
      const updated: number[] = state.unreadOrderIds.filter((id: number): boolean => id !== orderId);
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
