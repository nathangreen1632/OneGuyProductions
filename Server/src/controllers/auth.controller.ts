import type { Request, Response } from 'express';
import { User, OtpToken } from '../models/index.js';
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

export async function register(req: Request, res: Response): Promise<void> {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }

    const hashed = await hashPassword(password);
    const newUser = await User.create({ username, email, password: hashed });

    const token = generateJwt({ id: newUser.id });
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });

  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateJwt({ id: user.id });
    res.cookie('token', token, COOKIE_OPTIONS);

    // ✅ RETURN THE USER OBJECT!
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
}


// ✅ GET /api/auth/me
export async function getAuthenticatedUser(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const decoded = verifyJwt(token) as { id: string };
    const user = await User.findByPk(decoded.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requestOtp(req: Request, res: Response): Promise<void> {
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
        createdAt: {
          [Op.gt]: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      res.status(429).json({ error: 'Please wait 60 seconds before requesting another OTP.' });
      return;
    }

    const otp = generateOtp();
    const hashed = await hashOtp(otp);

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

export async function verifyOtp(req: Request, res: Response): Promise<void> {
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

    const isValid = await verifyPassword(otp, token.otpHash);
    const notExpired = token.expiresAt.getTime() > Date.now();

    if (!isValid || !notExpired) {
      res.status(401).json({ error: 'OTP is invalid or expired.' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const hashed = await hashPassword(newPassword);
    await user.update({ password: hashed });
    await OtpToken.destroy({ where: { email } });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
}

export async function debugUsers(_: Request, res: Response): Promise<void> {
  const users = await User.findAll();
  res.status(200).json(users);
}
