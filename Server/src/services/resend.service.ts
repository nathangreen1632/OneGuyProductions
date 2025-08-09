import { CreateEmailResponse, Resend } from 'resend';
import '../config/dotenv.config.js';
import { EnvConfig } from '../config/env.config.js';

const resend = new Resend(EnvConfig.RESEND_API_KEY);

if (!EnvConfig.RESEND_API_KEY) {
  console.error('❌ Missing RESEND_API_KEY in environment config');
}

export async function sendEmail(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<CreateEmailResponse> {
  try {
    return await resend.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    throw error;
  }
}

export async function sendOrderEmail(data: {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  description: string;
  businessName?: string;
  timeline: string;
}): Promise<CreateEmailResponse> {
  const html = `
    <html lang="en-US">
      <head><meta charset="UTF-8" /></head>
      <body>
        <h2>New Web Project Inquiry</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Business Name:</strong> ${data.businessName ?? 'N/A'}</p>
        <p><strong>Project Type:</strong> ${data.projectType}</p>
        <p><strong>Budget:</strong> ${data.budget}</p>
        <p><strong>Timeline:</strong> ${data.timeline}</p>
        <p><strong>Description:</strong><br>${data.description}</p>
      </body>
    </html>
  `;

  return await sendEmail({
    from: EnvConfig.EMAIL_FROM_ORDER ?? '',
    to: EnvConfig.RESEND_ORDER_RECEIVER_EMAIL ?? EnvConfig.RESEND_TO_ORDER ?? '',
    subject: `New Project Inquiry from ${data.name}`,
    html,
  });
}

export async function sendContactEmail(data: {
  name: string;
  email: string;
  message: string;
}): Promise<CreateEmailResponse> {
  const autoLinkedMessage = data.message
    .replace(/(\bhttps?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    .replace(/(\s\/[a-z0-9\-_/]+)/gi, match => `<a href="https://oneguyproductions.com${match.trim()}">${match.trim()}</a>`)
    .replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '<a href="mailto:$1">$1</a>');

  const html = `
    <html lang="en-US">
      <head><meta charset="UTF-8" /></head>
      <body>
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Message:</strong><br>${autoLinkedMessage}</p>
      </body>
    </html>
  `;

  return await sendEmail({
    from: EnvConfig.RESEND_FROM_EMAIL ?? EnvConfig.EMAIL_FROM_CONTACT ?? '',
    to: EnvConfig.RESEND_CONTACT_RECEIVER_EMAIL ?? EnvConfig.RESEND_TO_EMAIL ?? '',
    subject: `New Contact Message from ${data.name}`,
    html,
  });
}

export async function sendOtpEmail(email: string, otp: string): Promise<CreateEmailResponse> {
  const html = `
    <html lang="en-US">
      <head><meta charset="UTF-8" /></head>
      <body style="font-family: sans-serif; font-size: 16px;">
        <h2>Your One-Time Password (OTP)</h2>
        <p>Use the following code to reset your password:</p>
        <h1 style="letter-spacing: 2px; font-size: 32px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, you can safely ignore it.</p>
      </body>
    </html>
  `;

  return await sendEmail({
    from: EnvConfig.RESEND_FROM_EMAIL ?? 'noreply@oneguyproductions.com',
    to: email,
    subject: 'Your OTP Code for One Guy Productions',
    html,
  });
}
