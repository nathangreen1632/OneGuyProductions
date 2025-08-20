import type { CookieOptions } from 'express-serve-static-core';

const isProd: boolean = process.env.NODE_ENV === 'production';

export const COOKIE_OPTIONS_BASE: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  domain: isProd ? (process.env.COOKIE_DOMAIN || undefined) : undefined,
};

export function cookieOptions(remember?: boolean): CookieOptions {
  return {
    ...COOKIE_OPTIONS_BASE,
        maxAge: (remember ? 30 : 1.5) * 24 * 60 * 60 * 1000, // 30 days or 90 minutes
  };
}
