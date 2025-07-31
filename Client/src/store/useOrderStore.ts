// Client/src/store/useOrderStore.ts
import { create } from 'zustand';
import type { OrderPayload } from '../types/order';

interface OrderState {
  lastOrder: OrderPayload | null;
  setLastOrder: (order: OrderPayload) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearOrder: () => set({ lastOrder: null }),
}));
