import { Request, Response } from 'express';
import { sendContactEmail } from '../services/resend.service.js';

export async function submitContactForm(req: Request, res: Response): Promise<void> {

  const { name, email, message, captchaToken } = req.body;

  if (!name || !email || !message || !captchaToken) {
    console.warn('⚠️ Missing required fields in request:', {
      name,
      email,
      message,
      captchaTokenExists: !!captchaToken,
    });
    res.status(400).json({ error: 'Missing required fields or CAPTCHA token' });
    return;
  }

  let emailSuccess = false;

  try {
    await sendContactEmail({ name, email, message });
    emailSuccess = true;
  } catch (err) {
    console.error('❌ Error while sending contact email:', err);
  }

  if (!emailSuccess) {
    res.status(500).json({
      success: false,
      error: 'CAPTCHA passed, but failed to send message.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Message sent successfully',
  });
}
