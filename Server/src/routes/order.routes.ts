import { Router } from 'express';
import {
  submitOrder,
  getUserOrders,
  cancelOrder,
  downloadInvoice,
} from '../controllers/order.controller.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: Router = Router();

// ✅ Production route: Public form submission with reCAPTCHA
router.post('/submit', recaptchaMiddleware, submitOrder);

// ✅ Customer Portal routes (must be authenticated via JWT)
router.get('/my-orders', authenticateToken, getUserOrders);
router.patch('/:id/cancel', authenticateToken, cancelOrder);
router.get('/:id/invoice', authenticateToken, downloadInvoice);

export default router;
