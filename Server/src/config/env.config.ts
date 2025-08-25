import './dotenv.config.js';

export const REQUIRED_ENV: string[] = [
  'BCRYPT_SALT_ROUNDS',
  'DATABASE_URL',
  'EMAIL_FROM_CONTACT',
  'EMAIL_TO_CONTACT',
  'EMAIL_FROM_ORDER',
  'EMAIL_TO_ORDER',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_CREDENTIALS_B64',
  'JWT_EXPIRES_IN',
  'JWT_SECRET',
  'LOGO_BASE64',
  'PORT',
  'PUBLIC_BASE_URL',
  'RECAPTCHA_MIN_SCORE',
  'RECAPTCHA_PROJECT_ID',
  'RECAPTCHA_SITE_KEY',
  'RESEND_API_KEY',
  'RESEND_CONTACT_RECEIVER_EMAIL',
  'RESEND_FROM_EMAIL',
  'RESEND_ORDER_RECEIVER_EMAIL',
  'RESEND_TO_EMAIL',
  'SERVICE_ACCOUNT_KEY_PATH',
];

export const EnvConfig = {
  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,

  DATABASE_URL: process.env.DATABASE_URL,

  EMAIL_FROM_CONTACT: process.env.EMAIL_FROM_CONTACT,
  EMAIL_FROM_ORDER: process.env.EMAIL_FROM_ORDER,
  EMAIL_TO_CONTACT: process.env.EMAIL_TO_CONTACT,
  EMAIL_TO_ORDER: process.env.EMAIL_TO_ORDER,

  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_CREDENTIALS_B64: process.env.GOOGLE_CREDENTIALS_B64,

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_SECRET: process.env.JWT_SECRET,

  LOGO_BASE64: process.env.LOGO_BASE64,

  NODE_ENV: process.env.NODE_ENV ?? 'development',

  PORT: process.env.PORT ?? '3000',
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',

  RECAPTCHA_MIN_SCORE: process.env.RECAPTCHA_MIN_SCORE,
  RECAPTCHA_PROJECT_ID: process.env.RECAPTCHA_PROJECT_ID,
  RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_CONTACT_RECEIVER_EMAIL: process.env.RESEND_CONTACT_RECEIVER_EMAIL,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_ORDER_RECEIVER_EMAIL: process.env.RESEND_ORDER_RECEIVER_EMAIL,
  RESEND_TO_EMAIL: process.env.RESEND_TO_EMAIL,

  SERVICE_ACCOUNT_KEY_PATH: process.env.SERVICE_ACCOUNT_KEY_PATH,
} as const;

(function validateEnv(): void {
  const missing: string[] = REQUIRED_ENV.filter((k: string): boolean => {
    const v: unknown = (EnvConfig as Record<string, unknown>)[k];
    return v === undefined || v === null || v === '';
  });

  if (missing.length === 0) return;

  const msg: string =
    `Missing required environment variables (${missing.length}): ` +
    missing.join(', ');

  if (EnvConfig.NODE_ENV === 'production') {
    console.error(`[ENV:FATAL] ${msg}`);
    process.exit(1);
  } else {
    console.warn(`[ENV:WARN][${EnvConfig.NODE_ENV}] ${msg}`);
    console.warn('[ENV:WARN] Continuing in development; fill these before deploying.');
  }
})();
