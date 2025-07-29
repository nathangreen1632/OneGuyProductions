import { Request, Response } from 'express';
import { sendContactEmail } from '../services/Contact.service.js';
import { verifyRecaptchaToken } from '../services/recaptcha.service.js';

export async function submitContactForm(req: Request, res: Response): Promise<void> {
  console.log('📬 Contact route hit');
  const { name, email, message, captchaToken } = req.body;

  if (!name || !email || !message || !captchaToken) {
    res.status(400).json({ error: 'Missing required fields or CAPTCHA token' });
    return;
  }

  try {
    const human = await verifyRecaptchaToken(captchaToken, 'submit_contact_form');
    if (!human) {
      res.status(403).json({ error: 'CAPTCHA validation failed. Please try again.' });
      return;
    }

    await sendContactEmail({ name, email, message });
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('❌ Error in contact submission:', err);
    res.status(500).json({ error: 'Failed to process contact request' });
  }
}
