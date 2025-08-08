import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import type { Order, OrderPayload } from '../types/order.types';

interface OrderState {
  // From order form
  lastOrder: OrderPayload | null;
  setLastOrder: (order: OrderPayload) => void;
  clearOrder: () => void;

  // Customer portal
  orders: Order[];
  unreadOrderIds: number[];
  currentView: 'card' | 'timeline';

  fetchOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  markAsRead: (orderId: number) => void;
  setView: (view: 'card' | 'timeline') => void;
  updateOrder: (updated: Order) => void;
}

// ⬇️ Added for localStorage sync
const LOCAL_KEY = 'unreadOrderIds';

const loadUnread = (): number[] => {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveUnread = (ids: number[]): void => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('❌ Failed to persist unreadOrderIds to localStorage:', err);
  }
};

const orderStoreCreator: StateCreator<OrderState> = (set) => ({
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearOrder: () => set({ lastOrder: null }),

  orders: [],
  unreadOrderIds: loadUnread(), // ⬅️ Load from localStorage on init
  currentView: 'card',

  fetchOrders: async () => {
    try {
      const res = await fetch('/api/order/my-orders');
      const data = await res.json();

      console.log('📦 Raw /my-orders response:', data);
      console.log('🔍 Type of data:', typeof data);
      console.log('🔍 Is Array:', Array.isArray(data));

      if (!Array.isArray(data)) {
        console.error('🚨 Unexpected response format in fetchOrders():', data);
        return;
      }

      const existing = loadUnread();
      const incomingIds = data.map((order: Order) => order.id);
      const finalUnread = existing.length > 0 ? existing : incomingIds;

      saveUnread(finalUnread);

      set({
        orders: data,
        unreadOrderIds: finalUnread,
      });
    } catch (err) {
      console.error('❌ Error in fetchOrders():', err);
    }
  },

  refreshOrders: async () => {
    try {
      const res = await fetch('/api/order/my-orders');
      const data = await res.json();

      console.log('📦 Raw refresh /my-orders response:', data);
      console.log('🔍 Type of data:', typeof data);
      console.log('🔍 Is Array:', Array.isArray(data));

      if (!Array.isArray(data)) {
        console.error('🚨 Unexpected response format in refreshOrders():', data);
        return;
      }

      set({ orders: data });
    } catch (err) {
      console.error('❌ Error in refreshOrders():', err);
    }
  },

  markAsRead: (orderId) =>
    set((state) => {
      const updated = state.unreadOrderIds.filter((id) => id !== orderId);
      saveUnread(updated); // ⬅️ Persist to localStorage
      return { unreadOrderIds: updated };
    }),

  setView: (view) => set({ currentView: view }),

  updateOrder: (updated) =>
    set((state) => {
      const updatedOrders = state.orders.map((o) =>
        o.id === updated.id ? updated : o
      );

      console.log('🧪 updateOrder triggered');
      console.log('📌 New orders array:', updatedOrders);

      return {
        orders: [...updatedOrders], // 🔄 Ensure fresh array identity
      };
    }),
});

export const useOrderStore: UseBoundStore<StoreApi<OrderState>> =
  create<OrderState>(orderStoreCreator);
