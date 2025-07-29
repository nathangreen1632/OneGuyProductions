import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string } | null;
  token: string | null;
  setUser: (user: AuthState['user'], token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
