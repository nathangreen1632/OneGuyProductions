import './dotenv.config.js';

export const EnvConfig = {
  // Runtime environment
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  // Server configuration
  PORT: process.env.PORT ?? '3000', // fallback to 3000 if undefined

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,

  // Resend API
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_TO_EMAIL: process.env.RESEND_TO_EMAIL,

  // Contact Form Email Routing
  RESEND_CONTACT_RECEIVER_EMAIL: process.env.RESEND_CONTACT_RECEIVER_EMAIL,
  EMAIL_FROM_CONTACT: process.env.EMAIL_FROM_CONTACT,
  EMAIL_TO_CONTACT: process.env.EMAIL_TO_CONTACT,

  // Order Form Email Routing
  RESEND_ORDER_RECEIVER_EMAIL: process.env.RESEND_ORDER_RECEIVER_EMAIL,
  RESEND_TO_ORDER: process.env.RESEND_TO_ORDER,
  EMAIL_FROM_ORDER: process.env.EMAIL_FROM_ORDER,
  EMAIL_TO_ORDER: process.env.EMAIL_TO_ORDER,
};
