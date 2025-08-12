import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import type { Secret, SignOptions } from 'jsonwebtoken';

const jwtSecret: string | undefined = process.env.JWT_SECRET;
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'];
const saltRounds: number = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

if (!jwtSecret) {
  console.error('❌ JWT_SECRET is not defined.');
}

export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    console.warn('⚠️ Attempted to hash empty password');
    return '';
  }
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(input: string, actual: string): Promise<boolean> {
  if (!input || !actual) {
    console.warn('⚠️ Missing input or hash for password verification');
    return false;
  }

  try {
    return await bcrypt.compare(input, actual);
  } catch (err) {
    console.error('❌ bcrypt.compare threw an error:', err);
    return false;
  }
}

export function generateJwt(payload: object): string {
  if (!jwtSecret) {
    console.error('❌ Cannot generate JWT: missing secret.');
    return '';
  }

  return jwt.sign(payload, jwtSecret as Secret, {
    expiresIn: jwtExpiresIn,
  });
}

export function verifyJwt(token: string): string | jwt.JwtPayload {
  if (!jwtSecret) {
    console.error('❌ Cannot verify JWT: missing secret.');
    throw new Error('JWT_SECRET not set');
  }

  return jwt.verify(token, jwtSecret);
}

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export async function hashOtp(otp: string): Promise<string> {
  return await bcrypt.hash(otp, saltRounds);
}

