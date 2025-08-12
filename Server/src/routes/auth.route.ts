import { Router } from 'express';
import {
  register,
  login,
  logout,
  getAuthenticatedUser,
  requestOtp,
  verifyOtp,
  verifyAdminEmail,
  checkEmailDomain,
  debugUsers, requestAdminOtp,
} from '../controllers/auth.controller.js';
import { otpRateLimitMiddleware } from '../middleware/otp.middleware.js';

const router: Router = Router();

/** Authentication */
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getAuthenticatedUser);

/** Admin email verification */
router.post('/request-admin-otp', otpRateLimitMiddleware, requestAdminOtp);
router.post('/verify-email', verifyAdminEmail);

/** Password reset OTP */
router.post('/request-otp', otpRateLimitMiddleware, requestOtp);
router.post('/verify-otp', verifyOtp);

/** Utilities */
router.get('/check-email-domain', checkEmailDomain);

/** Debuggers (keep) */
router.get('/debug-users', debugUsers);

export default router;
