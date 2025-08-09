import {create, type StoreApi, type UseBoundStore} from 'zustand';

export interface TAuthUserType {
  id: string;
  email: string;
  username: string;
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

  setUser: (user: TAuthUserType, token: string | null): void =>
    set({
      user,
      token,
      isAuthenticated: !!user,
    }),

  logout: (): void =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),

  setHydrated: (val: boolean): void => set({ hydrated: val }),
}));
