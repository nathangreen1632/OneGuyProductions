import { Request, Response } from 'express';
import { sendContactEmail } from '../services/contact.service.js';

export async function submitContactForm(req: Request, res: Response): Promise<void> {
  console.log('📬 Contact route hit');
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    await sendContactEmail({ name, email, message });
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('❌ Error in contact submission:', err);
    res.status(500).json({ error: 'Failed to process contact request' });
  }
}
