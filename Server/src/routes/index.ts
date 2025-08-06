import { Router } from 'express';
import orderRoutes from './order.routes.js';
import contactRoutes from './contact.routes.js';
import authRoutes from './auth.routes.js';

const router: Router = Router();

router.use('/order', orderRoutes);
router.use('/contact', contactRoutes);
router.use('/auth', authRoutes);

export default router;
