import {create, type StoreApi, type UseBoundStore} from 'zustand';

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

export const useResetPasswordStore: UseBoundStore<StoreApi<ResetPasswordState>> = create<ResetPasswordState>((set) => ({
  modalOpen: false,
  step: 'request',
  loading: false,
  email: '',
  setEmail: (email: string): void => set({ email }),
  openModal: (): void => set({ modalOpen: true }),
  closeModal: (): void => set({ modalOpen: false }),
  setStep: (step: 'request' | 'verify'): void => set({ step }),
  setLoading: (value: boolean): void => set({ loading: value }),
  reset: (): void =>
    set({
      modalOpen: false,
      step: 'request',
      loading: false,
      email: '',
    }),
}));
