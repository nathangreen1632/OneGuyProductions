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
import { sendOtpEmail,  } from '../services/resend.service.js';
import { Op } from 'sequelize';
import { COOKIE_OPTIONS } from '../config/constants.config.js';

export async function register(
  req: Request<unknown, unknown, TRegisterBodyType>,
  res: Response
): Promise<void> {
  const { username, email, password, rememberMe } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }

    const hashed: string = await hashPassword(password);

    // Treat OGP emails as admin-candidates; others as normal users
    const isOGP = email.toLowerCase().endsWith('@oneguyproductions.com');

    const newUser = await User.create({
      username,
      email,
      password: hashed,
      // these fields exist in your updated user.model.ts + migration
      role: isOGP ? 'pending-admin' : 'user',
      emailVerified: false,
      adminCandidateAt: isOGP ? new Date() : null,
    });

    if (isOGP) {
      // Send admin verification OTP (same signatures you already use)
      const otp: string = generateOtp();
      const hashedOtp: string = await hashOtp(otp);

      await OtpToken.create({
        email,
        otpHash: hashedOtp,
        // match your existing 5-minute OTP expiry to avoid surprises
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      await sendOtpEmail(email, otp); // <- exactly 2 args

      res.status(201).json({
        success: true,
        next: 'verify-admin-email',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,                 // NEW
          emailVerified: newUser.emailVerified, // NEW
        },
      });

      return;
    }

    // Normal user flow (unchanged)
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
        role: newUser.role,                 // NEW
        emailVerified: newUser.emailVerified, // NEW
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
    const user = await User.findOne({ where: { email } });
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
        role: user.role,                   // NEW
        emailVerified: user.emailVerified, // NEW
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
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,                   // NEW
        emailVerified: user.emailVerified, // NEW
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
    // Must be OGP domain
    const isOGP = email.toLowerCase().endsWith('@oneguyproductions.com');
    if (!isOGP) {
      res.status(400).json({ error: 'Admin OTP is only available for @oneguyproductions.com emails.' });
      return;
    }

    // Must exist and be a pending admin
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'No account found for that email.' });
      return;
    }
    if (user.role !== 'pending-admin') {
      res.status(400).json({ error: 'Admin OTP can only be requested for pending admin accounts.' });
      return;
    }

    // Same short cooldown as user OTP
    const recentOtp = await OtpToken.findOne({
      where: { email, createdAt: { [Op.gt]: new Date(Date.now() - 60 * 1000) } },
    });
    if (recentOtp) {
      res.status(429).json({ error: 'Please wait 60 seconds before requesting another OTP.' });
      return;
    }

    // Generate + store (5‑minute expiry to match existing behavior)
    const otp: string = generateOtp();
    const hashed: string = await hashOtp(otp);
    await OtpToken.create({
      email,
      otpHash: hashed,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send with your existing branded template
    await sendOtpEmail(email, otp);

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
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'No account found for that email.' });
      return;
    }

    const recentOtp = await OtpToken.findOne({
      where: {
        email,
        createdAt: { [Op.gt]: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentOtp) {
      res.status(429).json({ error: 'Please wait 60 seconds before requesting another OTP.' });
      return;
    }

    const otp: string = generateOtp();
    const hashed: string = await hashOtp(otp);

    await OtpToken.create({
      email,
      otpHash: hashed,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(email, otp);
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
    const token = await OtpToken.findOne({
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

    const user = await User.findOne({ where: { email } });
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

// OPTIONAL: call this from /api/auth/verify-email after the user enters the admin OTP
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
    const token = await OtpToken.findOne({
      where: { email, expiresAt: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']],
    });

    if (!token) {
      res.status(400).json({ error: 'Code expired or not found.' });
      return;
    }

    const ok = await verifyPassword(otp, token.otpHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid code.' });
      return;
    }

    const user = await User.findOne({ where: { email } });
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
  const users = await User.findAll();
  res.status(200).json(users);
}

// Lightweight MX check for domains or full emails.
// Accepts ?email=<email-or-domain>. Returns { ok: true, hasMx: boolean }.
export async function checkEmailDomain(req: Request, res: Response): Promise<void> {
  const raw = (req.query?.email ?? '').toString().toLowerCase().trim();

  // Support either a full email or just a bare domain
  const domain = raw.includes('@') ? raw.split('@')[1] : raw;

  if (!domain) {
    res.status(200).json({ ok: true, hasMx: false });
    return;
  }

  try {
    const mx = await dns.resolveMx(domain);
    const hasMx = Array.isArray(mx) && mx.length > 0;
    res.status(200).json({ ok: true, hasMx });
  } catch {
    // NXDOMAIN / no MX → false, but still 200 to keep this as a UX helper
    res.status(200).json({ ok: true, hasMx: false });
  }
}

