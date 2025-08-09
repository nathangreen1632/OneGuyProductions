export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 1000 * 60 * 90,
  path: '/',
  domain: process.env.COOKIE_DOMAIN || undefined,
};