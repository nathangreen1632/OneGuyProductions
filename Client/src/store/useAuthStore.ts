import { create, type StoreApi, type UseBoundStore } from 'zustand';

export type UserRole = 'user' | 'pending-admin' | 'admin';

export interface TAuthUserType {
  id: string;
  email: string;
  username: string;
  role: UserRole;          // NEW
  emailVerified: boolean;  // NEW
}

export interface TAuthStateType {
  user: TAuthUserType | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  // keep the same signature to avoid cascades
  setUser: (user: TAuthUserType, token: string | null) => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore: UseBoundStore<StoreApi<TAuthStateType>> = create<TAuthStateType>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  // NOTE: call sites sometimes pass `null` (casted). We normalize here defensively.
  setUser: (user: TAuthUserType, token: string | null): void => {
    const u = user as unknown as Partial<TAuthUserType> | null;

    const normalized: TAuthUserType | null = u && typeof u === 'object'
      ? {
        id: String(u.id ?? ''),
        email: String(u.email ?? ''),
        username: String(u.username ?? ''),
        role: (u.role as UserRole) ?? 'user',                 // default safely
        emailVerified: Boolean(u.emailVerified ?? false),     // default safely
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
