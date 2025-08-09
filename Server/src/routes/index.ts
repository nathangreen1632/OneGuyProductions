import { Router } from 'express';
import adminRoutes from './admin.route.js';
import authRoutes from './auth.route.js';
import contactRoutes from './contact.route.js';
import orderRoutes from './order.route.js';

const router: Router = Router();

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/contact', contactRoutes);
router.use('/order', orderRoutes);

export default router;
