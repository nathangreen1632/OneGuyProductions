import { create } from 'zustand';

interface SignupPromptState {
  open: boolean;
  email: string | null;
  orderId: number | null;
  openPrompt: (email: string, orderId: number) => void;
  closePrompt: () => void;
  wasPrompted: (email: string) => boolean;
  markPrompted: (email: string) => void;
}

const KEY = 'promptedEmails';

const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const write = (arr: string[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch {}
};

export const useSignupPromptStore = create<SignupPromptState>((set, _get) => ({
  open: false,
  email: null,
  orderId: null,
  openPrompt: (email, orderId) => set({ open: true, email, orderId }),
  closePrompt: () => set({ open: false, email: null, orderId: null }),
  wasPrompted: (email) => read().includes(email.toLowerCase()),
  markPrompted: (email) => {
    const list = read();
    const lower = email.toLowerCase();
    if (!list.includes(lower)) {
      list.push(lower);
      write(list);
    }
  },
}));
