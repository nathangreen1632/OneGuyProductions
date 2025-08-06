// Server/src/config/constants.ts

export const COOKIE_OPTIONS = {
  httpOnly: true,           // ✅ Prevents JS access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // ✅ Only send over HTTPS in production
  sameSite: 'lax' as const, // ✅ Helps protect against CSRF; can be 'strict' or 'none' depending on your frontend domain
  maxAge: 1000 * 60 * 90,   // ✅ 90 minutes in ms
  path: '/',                // ✅ Available to the whole site
  domain: process.env.COOKIE_DOMAIN || undefined, // Optional: used for cross-subdomain setups
};
