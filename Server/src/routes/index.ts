import { Router } from 'express';
import orderRoutes from './order.routes.js';
import contactRoutes from './contact.routes.js';

const router: Router = Router();

router.use('/order', orderRoutes);
router.use('/contact', contactRoutes);

export default router;
