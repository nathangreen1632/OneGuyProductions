// Client/src/store/useResetPasswordStore.ts
import { create } from 'zustand';

interface ResetPasswordState {
  modalOpen: boolean;
  step: 'request' | 'verify';
  loading: boolean;
  email: string;
  setEmail: (email: string) => void;
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: 'request' | 'verify') => void;
  setLoading: (value: boolean) => void;
  reset: () => void;
}

export const useResetPasswordStore = create<ResetPasswordState>((set) => ({
  modalOpen: false,
  step: 'request',
  loading: false,
  email: '',
  setEmail: (email) => set({ email }),
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
  setStep: (step) => set({ step }),
  setLoading: (value) => set({ loading: value }),
  reset: () =>
    set({
      modalOpen: false,
      step: 'request',
      loading: false,
      email: '',
    }),
}));
