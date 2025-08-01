import { Router } from 'express';
import { submitOrder } from '../controllers/order.controller.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.middleware.js';

const router: Router = Router();

router.post('/submit', recaptchaMiddleware, submitOrder);

export default router;
