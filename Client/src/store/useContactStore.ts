import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';

interface ContactState {
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
}

const contactStoreCreator: StateCreator<ContactState> = (set) => ({
  submitting: false,
  setSubmitting: (value: boolean): void => {
    set({ submitting: value });
  },
});

export const useContactStore: UseBoundStore<StoreApi<ContactState>> =
  create<ContactState>(contactStoreCreator);
