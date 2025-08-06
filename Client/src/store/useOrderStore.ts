import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import type { Order, OrderPayload } from '../types/order';

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
}

const orderStoreCreator: StateCreator<OrderState> = (set) => ({
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearOrder: () => set({ lastOrder: null }),

  orders: [],
  unreadOrderIds: [],
  currentView: 'card',

  fetchOrders: async () => {
    try {
      const res = await fetch('/api/order/my-orders');
      const data = await res.json();

      console.log('📦 Raw /my-orders response:', data);
      console.log('🔍 Type of data:', typeof data);
      console.log('🔍 Is Array:', Array.isArray(data));

      if (!Array.isArray(data)) {
        throw new Error('🚨 Expected array but received: ' + JSON.stringify(data));
      }

      set({
        orders: data,
        unreadOrderIds: data.map((order: Order) => order.id),
      });
    } catch (err) {
      console.error('❌ Fetch error in fetchOrders():', err);
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
        throw new Error('🚨 Expected array but received: ' + JSON.stringify(data));
      }

      set({ orders: data });
    } catch (err) {
      console.error('❌ Refresh error in refreshOrders():', err);
    }
  },

  markAsRead: (orderId) =>
    set((state) => ({
      unreadOrderIds: state.unreadOrderIds.filter((id) => id !== orderId),
    })),

  setView: (view) => set({ currentView: view }),
});

export const useOrderStore: UseBoundStore<StoreApi<OrderState>> =
  create<OrderState>(orderStoreCreator);
