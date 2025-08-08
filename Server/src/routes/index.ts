import { Router } from 'express';
import orderRoutes from './order.route.js';
import contactRoutes from './contact.route.js';
import authRoutes from './auth.route.js';

const router: Router = Router();

router.use('/order', orderRoutes);
router.use('/contact', contactRoutes);
router.use('/auth', authRoutes);

export default router;
