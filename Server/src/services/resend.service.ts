import { CreateEmailResponse, Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// === 🛠️ Shared email sender utility ===
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
}): Promise<CreateEmailResponse> {
  const html = `
    <h2>New Web Project Inquiry</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Project Type:</strong> ${data.projectType}</p>
    <p><strong>Budget:</strong> ${data.budget}</p>
    <p><strong>Description:</strong><br>${data.description}</p>
  `;

  return await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.RESEND_ORDER_RECEIVER_EMAIL ?? process.env.RESEND_TO_EMAIL!, // fallback
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
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.RESEND_CONTACT_RECEIVER_EMAIL ?? process.env.RESEND_TO_EMAIL!, // fallback
    subject: `New Contact Message from ${data.name}`,
    html,
  });
}
