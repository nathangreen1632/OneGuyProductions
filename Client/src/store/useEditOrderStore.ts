// Client/src/store/useEditOrderStore.ts
import { create } from 'zustand';
import type { Order } from '../types/order.types';

interface EditOrderState {
  modalOpen: boolean;
  targetOrder: Order | null;
  openModal: (order: Order) => void;
  closeModal: () => void;
  refreshOrders: () => void;
}

export const useEditOrderStore = create<EditOrderState>((set) => ({
  modalOpen: false,
  targetOrder: null,

  openModal: (order) =>
    set({
      modalOpen: true,
      targetOrder: order,
    }),

  closeModal: () =>
    set({
      modalOpen: false,
      targetOrder: null,
    }),

  refreshOrders: () => {
    // Temporary hard reload, replace with SWR/React Query refetch later
    window.location.reload();
  },
}));
