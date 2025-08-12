import { Router } from 'express';
import {
  submitOrder,
  getMyOrders,
  getOrderThread,
  addOrderUpdate,
  markOrderRead,
  markAllOrdersRead,
  cancelOrder,
  downloadInvoice,
  updateOrder,
  linkOrderToCurrentUser,
} from '../controllers/order.controller.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.post('/submit', recaptchaMiddleware, submitOrder);
router.get('/my-orders', authenticateToken, getMyOrders);
router.patch('/:id', authenticateToken, updateOrder);
router.patch('/:id/link-user', authenticateToken, linkOrderToCurrentUser);
router.patch('/:id/cancel', authenticateToken, cancelOrder);
router.get('/:id/invoice', authenticateToken, downloadInvoice);
router.get('/:orderId/updates', authenticateToken, getOrderThread);
router.post('/:orderId/updates', authenticateToken, addOrderUpdate);
router.post('/:orderId/read', authenticateToken, markOrderRead);
router.post('/read-all', authenticateToken, markAllOrdersRead);

export default router;
