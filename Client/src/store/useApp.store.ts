import { create } from 'zustand';
import type { BoundStore } from './useBound.store';

const LOG_PREFIX = 'useAppStore';

interface AppState {
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

function safeSet<T>(
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  partial: Partial<T> | ((state: T) => Partial<T>)
): void {
  try {
    set(partial);
  } catch (err) {
    console.error(`${LOG_PREFIX}: set() failed`, err, { partial });
  }
}

export const useAppStore: BoundStore<AppState> = create<AppState>((set): AppState => ({
  menuOpen: false,

  toggleMenu: (): void => {
    try {
      safeSet<AppState>(set, (state) => ({ menuOpen: !state?.menuOpen }));
    } catch (err) {
      console.error(`${LOG_PREFIX}: toggleMenu threw`, err);
    }
  },

  closeMenu: (): void => {
    try {
      safeSet<AppState>(set, { menuOpen: false });
    } catch (err) {
      console.error(`${LOG_PREFIX}: closeMenu threw`, err);
    }
  },
}));
