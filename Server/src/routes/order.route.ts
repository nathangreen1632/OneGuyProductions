import { Router } from 'express';
import {
  submitOrder,
  getUserOrders,
  cancelOrder,
  downloadInvoice, updateOrder, linkOrderToCurrentUser
} from '../controllers/order.controller.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.post('/submit', recaptchaMiddleware, submitOrder);
router.get('/my-orders', authenticateToken, getUserOrders);
router.patch('/:id', authenticateToken, updateOrder);
router.patch('/:id/link-user', authenticateToken, linkOrderToCurrentUser);
router.patch('/:id/cancel', authenticateToken, cancelOrder);
router.get('/:id/invoice', authenticateToken, downloadInvoice);

export default router;
