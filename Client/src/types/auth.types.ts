export interface AuthFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterPayload = LoginPayload & {
  username: string;
};

export type TAuthEndpoint = '/api/auth/login' | '/api/auth/register';

export type TApiResult = { ok: boolean; data: unknown };

export type BuiltAuth = {
  endpoint: TAuthEndpoint;
  payload: LoginPayload | RegisterPayload;
};