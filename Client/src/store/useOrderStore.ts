import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import type { Order, OrderPayload } from '../types/order';
import { mockOrders } from '../mock/mockOrders'; // TEMP: replace with real fetch later

interface OrderState {
  // ✨ From existing form usage
  lastOrder: OrderPayload | null;
  setLastOrder: (order: OrderPayload) => void;
  clearOrder: () => void;

  // ✨ New for customer portal
  orders: Order[];
  currentView: 'card' | 'timeline';
  unreadOrderIds: number[];

  fetchOrders: () => void;
  markAsRead: (orderId: number) => void;
  setView: (view: 'card' | 'timeline') => void;
}

const orderStoreCreator: StateCreator<OrderState> = (set) => ({
  // --- From existing ---
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearOrder: () => set({ lastOrder: null }),

  // --- For customer portal ---
  orders: [],
  currentView: 'card',
  unreadOrderIds: [],

  fetchOrders: () => {
    // TODO: replace with real backend call
    set({
      orders: mockOrders,
      unreadOrderIds: mockOrders.map((o) => o.id),
    });
  },

  markAsRead: (orderId) =>
    set((state) => ({
      unreadOrderIds: state.unreadOrderIds.filter((id) => id !== orderId),
    })),

  setView: (view) => set({ currentView: view }),
});

export const useOrderStore: UseBoundStore<StoreApi<OrderState>> =
  create<OrderState>(orderStoreCreator);
