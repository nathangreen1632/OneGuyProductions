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

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getAuthenticatedUser);

router.post('/request-admin-otp', otpRateLimitMiddleware, requestAdminOtp);
router.post('/verify-email', verifyAdminEmail);

router.post('/request-otp', otpRateLimitMiddleware, requestOtp);
router.post('/verify-otp', verifyOtp);

router.get('/check-email-domain', checkEmailDomain);

router.get('/debug-users', debugUsers);

export default router;
