import { Router } from 'express';
import { submitContactForm } from '../controllers/contact.controller.js';
// import { recaptchaMiddleware } from '../middleware/recaptcha.middleware.js';

const router: Router = Router();

router.post('/submit', submitContactForm);

export default router;
