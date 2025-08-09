import {create, type StoreApi, type UseBoundStore} from 'zustand';

export interface TSignupPromptStateType {
  open: boolean;
  email: string | null;
  orderId: number | null;
  openPrompt: (email: string, orderId: number) => void;
  closePrompt: () => void;
  wasPrompted: (email: string) => boolean;
  markPrompted: (email: string) => void;
}

const KEY: string = 'promptedEmails';

const read: () => string[] = (): string[] => {
  try {
    const raw: string | null = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const write: (arr: string[]) => void = (arr: string[]): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch (err) {
    console.error(`❌ Failed to write to localStorage key "${KEY}":`, err);
  }
};

export const useSignupPromptStore: UseBoundStore<StoreApi<TSignupPromptStateType>> = create<TSignupPromptStateType>((set) => ({
  open: false,
  email: null,
  orderId: null,

  openPrompt: (email: string, orderId: number): void =>
    set({ open: true, email, orderId }),

  closePrompt: (): void =>
    set({ open: false, email: null, orderId: null }),

  wasPrompted: (email: string): boolean =>
    read().includes(email.toLowerCase()),

  markPrompted: (email: string): void => {
    const list: string[] = read();
    const lower: string = email.toLowerCase();
    if (!list.includes(lower)) {
      list.push(lower);
      write(list);
    }
  },
}));
