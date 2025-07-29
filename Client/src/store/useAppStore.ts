import { create } from 'zustand';

interface AppState {
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  menuOpen: false,
  toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
  closeMenu: () => set({ menuOpen: false }),
}));
