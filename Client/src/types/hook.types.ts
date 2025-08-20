import type {TAuthUserType} from "../store/useAuth.store";

export type AuthMeUser = Pick<TAuthUserType, 'id' | 'email' | 'role' | 'emailVerified'> &
  Partial<Pick<TAuthUserType, 'username'>>;

export type AuthMeResponse = { user?: AuthMeUser } | null;

export type MeResult = {
  reachedServer: boolean;
  user: AuthMeUser | null;
};