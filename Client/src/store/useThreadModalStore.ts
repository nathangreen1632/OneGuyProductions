import {create, type StoreApi, type UseBoundStore} from 'zustand';

interface ThreadModalState {
  isOpen: boolean;
  orderId: number | null;
  open: (orderId: number) => void;
  close: () => void;
}

export const useThreadModalStore: UseBoundStore<StoreApi<ThreadModalState>> = create<ThreadModalState>((set) => ({
  isOpen: false,
  orderId: null,
  open: (orderId: number): void => set({ isOpen: true, orderId }),
  close: (): void => set({ isOpen: false, orderId: null }),
}));
