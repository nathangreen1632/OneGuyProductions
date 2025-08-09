import type { Request, Response, NextFunction } from 'express';
import { OtpToken } from '../models/index.js';
import { Op } from 'sequelize';
import {OtpTokenInstance} from "../models/otpToken.model.js";

export async function otpRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  try {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const recentOtp: OtpTokenInstance | null = await OtpToken.findOne({
      where: {
        email,
        createdAt: { [Op.gt]: oneMinuteAgo },
      },
    });

    if (recentOtp) {
      res.status(429).json({
        error: 'Please wait 60 seconds before requesting another OTP.',
      });
      return;
    }

    next();
  } catch (err) {
    console.error('OTP Rate Limit Middleware Error:', err);
    res.status(500).json({ error: 'OTP rate limiter failed.' });
  }
}
