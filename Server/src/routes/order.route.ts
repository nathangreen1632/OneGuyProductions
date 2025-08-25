import { Router } from 'express';
import {
  submitOrder,
  getMyOrders,
  updateOrder,
  cancelOrder,
  downloadOrderInvoice,
  linkOrderToCurrentUser,
  getOrderThread,
  addOrderUpdate,
  markOrderRead,
  markAllOrdersRead,
  getInbox,
  updateOrderInvoice,
} from '../controllers/order.controller.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router: Router = Router();

router.post('/submit', recaptchaMiddleware, submitOrder);

router.get('/my-orders', authenticateToken, getMyOrders);
router.get('/inbox', authenticateToken, getInbox);

router.patch('/:id', authenticateToken, updateOrder);
router.patch('/:id/cancel', authenticateToken, cancelOrder);
router.patch('/:id/link-user', authenticateToken, linkOrderToCurrentUser);

router.patch('/:id/invoice', authenticateToken, updateOrderInvoice);
router.get('/:id/invoice',   authenticateToken, downloadOrderInvoice);

router.get('/:orderId/updates', authenticateToken, getOrderThread);
router.post('/:orderId/updates', authenticateToken, addOrderUpdate);

router.post('/:orderId/read', authenticateToken, markOrderRead);
router.post('/read-all', authenticateToken, markAllOrdersRead);

export default router;
