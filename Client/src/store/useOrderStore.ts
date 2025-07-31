import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import type { OrderPayload } from '../types/order';

interface OrderState {
  lastOrder: OrderPayload | null;
  setLastOrder: (order: OrderPayload) => void;
  clearOrder: () => void;
}

const orderStoreCreator: StateCreator<OrderState> = (set) => ({
  lastOrder: null,

  setLastOrder: (order: OrderPayload): void => {
    set({ lastOrder: order });
  },

  clearOrder: (): void => {
    set({ lastOrder: null });
  },
});

export const useOrderStore: UseBoundStore<StoreApi<OrderState>> =
  create<OrderState>(orderStoreCreator);
