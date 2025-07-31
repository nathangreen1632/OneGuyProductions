import { create } from 'zustand';

interface ContactState {
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
}

export const useContactStore = create<ContactState>((set) => ({
  submitting: false,
  setSubmitting: (value) => set({ submitting: value }),
}));
