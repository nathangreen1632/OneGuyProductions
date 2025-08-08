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