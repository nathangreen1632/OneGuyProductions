import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  username: string; // ✅ Add this line
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setUser: (user: AuthUser, token: string | null) => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false, // ✅ added for session readiness

  setUser: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: !!user,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),

  setHydrated: (val) => set({ hydrated: val }),
}));
