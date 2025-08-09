import dotenv, {DotenvConfigOutput} from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

if (process.env.RENDER === undefined) {
  const result: DotenvConfigOutput = dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
  });

  if (result.error) {
    // eslint-disable-next-line no-console
    console.error('FATAL: Failed to load .env file:', result.error);
    process.exit(1);
  }
}

const REQUIRED_ENV: string[] = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'RESEND_TO_EMAIL',
  'RESEND_CONTACT_RECEIVER_EMAIL',
  'RESEND_ORDER_RECEIVER_EMAIL',
  'EMAIL_FROM_ORDER',
  'EMAIL_TO_ORDER',
  'EMAIL_FROM_CONTACT',
  'EMAIL_TO_CONTACT',
  'PUBLIC_BASE_URL',

];

const missingVars: string[] = REQUIRED_ENV.filter((v: string): boolean => !process.env[v]);
if (missingVars.length) {
  // eslint-disable-next-line no-console
  console.error(
    `FATAL: Missing required environment variables: ${missingVars.join(', ')}`
  );
  process.exit(1);
}
