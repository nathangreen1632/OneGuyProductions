// Server/src/utils/otp-issuer.util.ts
import { Op } from 'sequelize';
import { OtpToken } from '../models/index.js';
import { generateOtp, hashOtp } from '../services/auth.service.js';
import { sendOtpEmail } from '../services/resend.service.js';
import { otpExpiryDate, throttleSince } from './otp.util.js';
import {OtpTokenInstance} from "../models/otpToken.model.js";

export type TOtpIssueResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function issueOtpForEmail(email: string): Promise<TOtpIssueResult> {
  const recent: OtpTokenInstance | null = await OtpToken.findOne({
    where: { email, createdAt: { [Op.gt]: throttleSince() } },
  });
  if (recent) {
    return { ok: false, status: 429, error: 'Please wait 60 seconds before requesting another OTP.' };
  }

  const otp: string = generateOtp();
  const hashed: string = await hashOtp(otp);
  await OtpToken.create({
    email,
    otpHash: hashed,
    expiresAt: otpExpiryDate(),
  });

  await sendOtpEmail(email, otp);

  return { ok: true };
}
