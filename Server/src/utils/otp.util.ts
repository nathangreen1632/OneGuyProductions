export const OTP_EXPIRY_MS = 2 * 60 * 1000;

export const OTP_THROTTLE_MS = 60 * 1000;

export function otpExpiryDate(now: number = Date.now()): Date {
  return new Date(now + OTP_EXPIRY_MS);
}

export function throttleSince(now: number = Date.now()): Date {
  return new Date(now - OTP_THROTTLE_MS);
}
