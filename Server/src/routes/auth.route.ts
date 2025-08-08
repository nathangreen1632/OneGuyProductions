import { Router } from 'express';
import { register, login, logout, requestOtp, verifyOtp, debugUsers, getAuthenticatedUser } from '../controllers/auth.controller.js';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getAuthenticatedUser); // ✅ new route
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.get('/debug-users', debugUsers);

export default router;
