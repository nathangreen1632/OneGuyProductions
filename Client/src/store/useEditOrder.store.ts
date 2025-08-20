import {create, type StoreApi, type UseBoundStore} from 'zustand';
import type { Order } from '../types/order.types';

interface EditOrderState {
  modalOpen: boolean;
  targetOrder: Order | null;
  openModal: (order: Order) => void;
  closeModal: () => void;
  refreshOrders: () => void;
}

export const useEditOrderStore: UseBoundStore<StoreApi<EditOrderState>> = create<EditOrderState>((set) => ({
  modalOpen: false,
  targetOrder: null,

  openModal: (order: Order): void =>
    set({
      modalOpen: true,
      targetOrder: order,
    }),

  closeModal: (): void =>
    set({
      modalOpen: false,
      targetOrder: null,
    }),

  refreshOrders: (): void => {
    window.location.reload();
  },
}));
