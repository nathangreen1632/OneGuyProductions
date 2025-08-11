import { Router } from 'express';
import { requireAdmin } from '../middleware/adminGuard.middleware.js';
import {
  getAdminOrders,
  getOrderThread,
  setOrderStatus,
  assignOrderToAdmin,
} from '../controllers/admin.controller.js';
import { addOrderUpdate } from '../controllers/order.controller.js';

const router: Router = Router();

router.get('/orders', requireAdmin, getAdminOrders);
router.get('/orders/:orderId/updates', requireAdmin, getOrderThread);
router.post('/orders/:orderId/updates', requireAdmin, addOrderUpdate);

router.post('/orders/:orderId/status', requireAdmin, setOrderStatus);
router.post('/orders/:orderId/assign', requireAdmin, assignOrderToAdmin);

router.patch('/orders/:orderId/status', requireAdmin, setOrderStatus);
router.patch('/orders/:orderId/assign', requireAdmin, assignOrderToAdmin);

export default router;
