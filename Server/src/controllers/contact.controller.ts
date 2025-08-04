import { Request, Response } from 'express';
import { sendContactEmail } from '../services/resend.service.js';

export async function submitContactForm(req: Request, res: Response): Promise<void> {
  console.log('📬 Contact route hit');

  const { name, email, message, captchaToken } = req.body;

  // 🚨 Validate required fields
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

  // 🔐 reCAPTCHA token was already verified in middleware — skip re-verification

  // ✉️ Attempt to send contact email
  let emailSuccess = false;

  try {
    await sendContactEmail({ name, email, message });
    emailSuccess = true;
    console.log('✅ Contact email sent successfully.');
  } catch (err) {
    console.error('❌ Error while sending contact email:', err);
  }

  // 🧾 Respond to client
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
