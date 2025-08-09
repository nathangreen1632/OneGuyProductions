import type { Request, Response, CookieOptions } from 'express';
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

type TRegisterBodyType = {
  username: string;
  email: string;
  password: string;
  rememberMe?: boolean;
};

type TLoginBodyType = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

type TJwtPayloadType = {
  id: string;
};

type TRequestOtpBodyType = {
  email: string;
};

type TVerifyOtpBodyType = {
  email: string;
  otp: string;
  newPassword: string;
};

type TCookieOptionsType = CookieOptions;

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
    const newUser = await User.create({ username, email, password: hashed });

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
      },
    });
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
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

export async function debugUsers(_: Request, res: Response): Promise<void> {
  const users = await User.findAll();
  res.status(200).json(users);
}
