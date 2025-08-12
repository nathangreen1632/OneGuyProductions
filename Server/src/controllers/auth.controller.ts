import type { Request, Response } from 'express';
import { promises as dns } from 'dns';
import { User, OtpToken } from '../models/index.js';
import type {
  TRegisterBodyType,
  TLoginBodyType,
  TJwtPayloadType,
  TRequestOtpBodyType,
  TVerifyOtpBodyType,
  TCookieOptionsType,
} from '../types/auth.types.js';
import {
  hashPassword,
  verifyPassword,
  generateJwt,
  generateOtp,
  hashOtp,
  verifyJwt,
} from '../services/auth.service.js';
import { sendOtpEmail } from '../services/resend.service.js';
import { Op } from 'sequelize';
import { COOKIE_OPTIONS } from '../config/constants.config.js';
import { otpExpiryDate } from '../utils/otp.util.js';
import { issueOtpForEmail } from '../utils/otp-issuer.util.js';
import {OtpTokenInstance} from "../models/otpToken.model.js";

export async function register(
  req: Request<unknown, unknown, TRegisterBodyType>,
  res: Response
): Promise<void> {
  const { username, email, password, rememberMe } = req.body;

  try {
    const existingUser: User | null = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }

    const hashed: string = await hashPassword(password);
    const isOGP: boolean = email.toLowerCase().endsWith('@oneguyproductions.com');

    const newUser: User = await User.create({
      username,
      email,
      password: hashed,
      role: isOGP ? 'pending-admin' : 'user',
      emailVerified: false,
      adminCandidateAt: isOGP ? new Date() : null,
    });

    if (isOGP) {
      const otp: string = generateOtp();
      const hashedOtp: string = await hashOtp(otp);

      await OtpToken.create({
        email,
        otpHash: hashedOtp,
        expiresAt: otpExpiryDate(),
      });

      await sendOtpEmail(email, otp);

      res.status(201).json({
        success: true,
        next: 'verify-admin-email',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          emailVerified: newUser.emailVerified,
        },
      });
      return;
    }

    const token: string = generateJwt({ id: newUser.id });
    const options: TCookieOptionsType = {
      ...COOKIE_OPTIONS,
      ...(rememberMe && { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
    };

    res.cookie('token', token, options);
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
      },
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
}

export async function login(
  req: Request<unknown, unknown, TLoginBodyType>,
  res: Response
): Promise<void> {
  const { email, password, rememberMe } = req.body;

  try {
    const user: User | null = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isPasswordValid: boolean = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token: string = generateJwt({ id: user.id });
    const options: TCookieOptionsType = {
      ...COOKIE_OPTIONS,
      ...(rememberMe && { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
    };

    res.cookie('token', token, options);
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
}

export async function getAuthenticatedUser(req: Request, res: Response): Promise<void> {
  const token: string | undefined = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = verifyJwt(token) as TJwtPayloadType;
    const user: User | null = await User.findByPk(decoded.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requestAdminOtp(
  req: Request<unknown, unknown, TRequestOtpBodyType>,
  res: Response
): Promise<void> {
  const { email } = req.body;

  try {
    const isOGP: boolean = email.toLowerCase().endsWith('@oneguyproductions.com');
    if (!isOGP) {
      res.status(400).json({ error: 'Admin OTP is only available for @oneguyproductions.com emails.' });
      return;
    }

    const user: User | null = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'No account found for that email.' });
      return;
    }
    if (user.role !== 'pending-admin') {
      res.status(400).json({ error: 'Admin OTP can only be requested for pending admin accounts.' });
      return;
    }

    const result = await issueOtpForEmail(email);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Admin OTP Request Error:', err);
    res.status(500).json({ error: 'Failed to send admin OTP.' });
  }
}

export async function requestOtp(
  req: Request<unknown, unknown, TRequestOtpBodyType>,
  res: Response
): Promise<void> {
  const { email } = req.body;

  try {
    const user: User | null = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'No account found for that email.' });
      return;
    }

    const result = await issueOtpForEmail(email);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('OTP Request Error:', err);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
}

export function logout(_: Request, res: Response): void {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({ success: true });
}

export async function verifyOtp(
  req: Request<unknown, unknown, TVerifyOtpBodyType>,
  res: Response
): Promise<void> {
  const { email, otp, newPassword } = req.body;

  try {
    const token: OtpTokenInstance | null = await OtpToken.findOne({
      where: { email },
      order: [['createdAt', 'DESC']],
    });

    if (!token) {
      res.status(404).json({ error: 'OTP not found.' });
      return;
    }

    const isValid: boolean = await verifyPassword(otp, token.otpHash);
    const notExpired: boolean = token.expiresAt.getTime() > Date.now();
    if (!isValid || !notExpired) {
      res.status(401).json({ error: 'OTP is invalid or expired.' });
      return;
    }

    const user: User | null = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const hashed: string = await hashPassword(newPassword);
    await user.update({ password: hashed });
    await OtpToken.destroy({ where: { email } });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
}

export async function verifyAdminEmail(
  req: Request<unknown, unknown, { email: string; otp: string }>,
  res: Response
): Promise<void> {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    res.status(400).json({ error: 'Email and code required.' });
    return;
  }

  try {
    const token: OtpTokenInstance | null = await OtpToken.findOne({
      where: { email, expiresAt: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']],
    });

    if (!token) {
      res.status(400).json({ error: 'Code expired or not found.' });
      return;
    }

    const ok: boolean = await verifyPassword(otp, token.otpHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid code.' });
      return;
    }

    const user: User | null = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const updates: Partial<User> = {
      emailVerified: true,
      ...(user.role === 'pending-admin' ? { role: 'admin', adminVerifiedAt: new Date() } : {}),
    } as any;

    await user.update(updates as any);
    await OtpToken.destroy({ where: { email } });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('verifyAdminEmail error:', err);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
}

export async function debugUsers(_: Request, res: Response): Promise<void> {
  const users: User[] = await User.findAll();
  res.status(200).json(users);
}

export async function checkEmailDomain(req: Request, res: Response): Promise<void> {
  const raw: string = (req.query?.email ?? '').toString().toLowerCase().trim();
  const domain: string = raw.includes('@') ? raw.split('@')[1] : raw;

  if (!domain) {
    res.status(200).json({ ok: true, hasMx: false });
    return;
  }

  try {
    const mx = await dns.resolveMx(domain);
    const hasMx: boolean = Array.isArray(mx) && mx.length > 0;
    res.status(200).json({ ok: true, hasMx });
  } catch {
    res.status(200).json({ ok: true, hasMx: false });
  }
}
