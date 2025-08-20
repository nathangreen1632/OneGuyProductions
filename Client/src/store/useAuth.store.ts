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

const LOG_PREFIX = 'useAuthStore';

function isUserRole(v: unknown): v is UserRole {
  return v === 'user' || v === 'pending-admin' || v === 'admin';
}

function normalizeToken(v: unknown): string | null {
  try {
    if (v == null) return null;

    let s: string = '';

    if (typeof v === 'string') {
      s = v;
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      s = String(v);
    } else if (v instanceof Date && Number.isFinite(v.getTime())) {
      s = v.toISOString();
    } else {
      return null;
    }

    s = s.trim();
    if (!s) return null;

    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(s)) return null;

    return s;
  } catch {
    return null;
  }
}

function normalizeUser(input: unknown): TAuthUserType | null {
  try {
    if (!input || typeof input !== 'object') return null;
    const u = input as Partial<TAuthUserType>;

    const id: string = String((u as any).id ?? '');
    const email: string = String((u as any).email ?? '');
    const username: string = String((u as any).username ?? '');
    const role: UserRole = isUserRole((u as any).role) ? (u as any).role as UserRole : 'user';
    const emailVerified: boolean = Boolean((u as any).emailVerified ?? false);

    return { id, email, username, role, emailVerified };
  } catch (err) {
    console.error(`${LOG_PREFIX}: normalizeUser failed`, err, { input });
    return null;
  }
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

export const useAuthStore: UseBoundStore<StoreApi<TAuthStateType>> = create<TAuthStateType>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  setUser: (user: TAuthUserType, token: string | null): void => {
    try {
      const normalizedUser: TAuthUserType | null = normalizeUser(user);
      const normalizedToken: string | null = normalizeToken(token);

      safeSet<TAuthStateType>(set, {
        user: normalizedUser,
        token: normalizedToken,
        isAuthenticated: Boolean(normalizedUser),
      });
    } catch (err) {
      console.error(`${LOG_PREFIX}: setUser threw`, err, { user, token });
      safeSet<TAuthStateType>(set, {
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  logout: (): void => {
    try {
      safeSet<TAuthStateType>(set, {
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (err) {
      console.error(`${LOG_PREFIX}: logout threw`, err);
    }
  },

  setHydrated: (val: boolean): void => {
    try {
      safeSet<TAuthStateType>(set, { hydrated: Boolean(val) });
    } catch (err) {
      console.error(`${LOG_PREFIX}: setHydrated threw`, err, { val });
    }
  },
}));
