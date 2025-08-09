import {create} from 'zustand';
import type {BoundStore} from "./useBoundStore";

interface AppState {
  menuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

export const useAppStore: BoundStore<AppState> = create<AppState>(
  (set: (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void): AppState => ({
    menuOpen: false,

    toggleMenu: (): void =>
      set((state: AppState): Partial<AppState> => ({
        menuOpen: !state.menuOpen,
      })),

    closeMenu: (): void =>
      set({ menuOpen: false }),
  })
);

