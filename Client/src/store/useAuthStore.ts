import { create, type StoreApi, type UseBoundStore } from 'zustand';

export type UserRole = 'user' | 'pending-admin' | 'admin';

export interface TAuthUserType {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface TAuthStateType {
  user: TAuthUserType | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setUser: (user: TAuthUserType, token: string | null) => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore: UseBoundStore<StoreApi<TAuthStateType>> = create<TAuthStateType>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  setUser: (user: TAuthUserType, token: string | null): void => {
    const u = user as unknown as Partial<TAuthUserType> | null;

    const normalized: TAuthUserType | null = u && typeof u === 'object'
      ? {
        id: String(u.id ?? ''),
        email: String(u.email ?? ''),
        username: String(u.username ?? ''),
        role: (u.role as UserRole) ?? 'user',
        emailVerified: Boolean(u.emailVerified ?? false),
      }
      : null;

    set({
      user: normalized,
      token: token ?? null,
      isAuthenticated: !!normalized,
    });
  },

  logout: (): void =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),

  setHydrated: (val: boolean): void => set({ hydrated: val }),
}));
