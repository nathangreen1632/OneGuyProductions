export type AuthState = {
  isAuthenticated: boolean;
  hydrated: boolean;
  user: {
    username?: string;
    email?: string;
  } | null;
  logout: () => void;
};
