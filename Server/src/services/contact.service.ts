import { sendEmail } from './resend.service.js';

export async function sendContactEmail(data: { name: string; email: string; message: string }) {
  const from = process.env.RESEND_FROM_EMAIL!;
  const to = process.env.RESEND_TO_EMAIL!;

  if (!from || !to) {
    throw new Error('Missing RESEND_FROM_EMAIL or RESEND_TO_EMAIL in environment variables.');
  }

  await sendEmail({
    from,
    to,
    subject: `New contact from ${data.name}`,
    html: `
      <h2>Contact Request</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Message:</strong><br>${data.message}</p>
    `,
  });
}
