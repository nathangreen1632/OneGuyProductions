import { CreateEmailResponse, Resend } from 'resend';
import '../config/dotenv.js'
import {ENV} from "../config/env.js";

const resend = new Resend(ENV.RESEND_API_KEY);

// === Shared email sender utility ===
export async function sendEmail(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<CreateEmailResponse> {
  return await resend.emails.send({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

// === 💼 Project Order Email ===
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
    <h2>New Web Project Inquiry</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Business Name:</strong> ${data.businessName ?? 'N/A'}</p>
    <p><strong>Project Type:</strong> ${data.projectType}</p>
    <p><strong>Budget:</strong> ${data.budget}</p>
    <p><strong>Timeline:</strong> ${data.timeline}</p>
    <p><strong>Description:</strong><br>${data.description}</p>
  `;

  return await sendEmail({
    from: ENV.EMAIL_FROM_ORDER,
    to: ENV.RESEND_ORDER_RECEIVER_EMAIL ?? ENV.RESEND_TO_ORDER!,
    subject: `New Project Inquiry from ${data.name}`,
    html,
  });
}


// === 📬 Contact Form Email ===
export async function sendContactEmail(data: {
  name: string;
  email: string;
  message: string;
}): Promise<CreateEmailResponse> {
  const html = `
    <h2>New Contact Message</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Message:</strong><br>${data.message}</p>
  `;

  return await sendEmail({
    from: ENV.RESEND_FROM_EMAIL ?? ENV.EMAIL_FROM_CONTACT,
    to: ENV.RESEND_CONTACT_RECEIVER_EMAIL ?? ENV.RESEND_TO_EMAIL ?? '',
    subject: `New Contact Message from ${data.name}`,
    html,
  });
}
