import type {CookieOptions} from "express";

export type TRegisterBodyType = {
  username: string;
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type TLoginBodyType = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type TJwtPayloadType = { id: string };

export type TRequestOtpBodyType = { email: string };

export type TVerifyOtpBodyType = {
  email: string;
  otp: string;
  newPassword: string;
};

export type TCookieOptionsType = CookieOptions;
