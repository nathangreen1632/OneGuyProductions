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
  const desc = (data.description ?? '')
    .replace(/(\bhttps?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    .replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '<a href="mailto:$1">$1</a>');

  const brand = 'One Guy Productions';
  const red500 = '#ef4444';
  const black = '#000000';
  const white = '#ffffff';

  const preheader = `New web project inquiry from ${data.name} (${data.projectType}, ${data.budget})`;

  const html = `
  <!DOCTYPE html>
  <html lang="en" style="margin:0; padding:0;">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${brand} — New Project Inquiry</title>
      <style>
        a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}

        /* Base */
        .bg-page { background:${black}; }
        .card { background:#0b0b0b; border:1px solid: ${red500}; }
        .text { color:${white}; }
        .muted { opacity:.85; }
        .link { color:${red500}; text-decoration:underline; }
        .message-box {
          background:#101010;
          border-radius:12px;
          padding:16px;
          text-align:left !important;
        }
        .btn {
          display:inline-block;
          background:${red500};
          color:${black};
          font-weight:700;
          padding:12px 16px;
          border-radius:999px;
          text-decoration:none;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .bg-page { background:#000 !important; }
          .card { background:#0b0b0b !important; border-color:${red500} !important; }
          .text { color:#ffffff !important; }
          .message-box { background:#111 !important; }
          .link { color:${red500} !important; }
        }

        /* Outlook.com / O365 dark mode */
        [data-ogsc] .bg-page { background:#000 !important; }
        [data-ogsc] .card { background:#0b0b0b !important; border-color:${red500} !important; }
        [data-ogsc] .text { color:#ffffff !important; }
        [data-ogsc] .message-box { background:#111 !important; }
        [data-ogsc] .link { color:${red500} !important; }
      </style>
    </head>
    <body class="bg-page" style="margin:0; padding:0; background:${black}; color:${white}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <!-- Preheader (hidden) -->
      <div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0; color:transparent;">
        ${preheader}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
              <tr>
                <td style="padding:0 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" style="border-radius:16px; overflow:hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background:${red500}; padding:14px 20px;">
                        <table role="presentation" width="100%">
                          <tr>
                            <td style="font-size:18px; font-weight:700; color:${black}; letter-spacing:.3px;">${brand}</td>
                            <td align="right" style="font-size:12px; color:${black}; opacity:.85;">New Project Inquiry</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td class="text" style="padding:28px 24px 10px 24px;">
                        <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.3; font-weight:700;">New Web Project Inquiry</h2>
                        <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">Submitted from your order form.</p>

                        <!-- Meta -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px 0;">
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Name:</strong> <span style="opacity:.95;">${data.name}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Email:</strong>
                              <a href="mailto:${data.email}" class="link" style="color:${red500}; text-decoration:underline;">${data.email}</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Business Name:</strong>
                              <span style="opacity:.95;">${data.businessName ?? 'N/A'}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Project Type:</strong>
                              <span style="opacity:.95;">${data.projectType}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Budget:</strong>
                              <span style="opacity:.95;">${data.budget}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Timeline:</strong>
                              <span style="opacity:.95;">${data.timeline}</span>
                            </td>
                          </tr>
                        </table>

                        <!-- Description (force left alignment at TD level) -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px 0;">
                          <tr>
                            <td align="left" style="text-align:left !important; padding:0;">
                              <div class="message-box" style="white-space:pre-wrap; word-break:break-word; color:${white}; text-align:left !important;">
                                ${desc}
                              </div>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA -->
                        <p style="margin:16px 0 0 0;">
                          <a href="mailto:${data.email}?subject=Re:%20Your%20project%20inquiry%20with%20${encodeURIComponent(brand)}"
                             class="btn" style="background:${red500}; color:${black}; font-weight:700; padding:12px 16px; border-radius:999px; text-decoration:none;">
                            Reply to ${data.name}
                          </a>
                        </p>
                      </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                      <td style="padding:10px 24px 0 24px;">
                        <hr style="border:none; height:1px; background:${red500}; opacity:.4;" />
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td class="text" style="padding:14px 24px 24px 24px;">
                        <p style="margin:0; font-size:12px; line-height:1.6; opacity:.8;">
                          This inquiry was submitted from the order form on oneguyproductions.com.
                        </p>
                        <p style="margin:8px 0 0 0; font-size:12px; line-height:1.6; opacity:.6;">
                          © ${new Date().getFullYear()} ${brand}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({
    from: EnvConfig.EMAIL_FROM_ORDER ?? '',
    to: EnvConfig.RESEND_ORDER_RECEIVER_EMAIL ?? '',
    subject: `New Project Inquiry from ${data.name}`,
    html,
  });
}


export async function sendOrderUpdateNotificationEmail(options: {
  to: string;
  orderId: number;
  actorLabel: string;
  bodyPreview: string;
  orderUrl: string;
  from?: string;
}): Promise<CreateEmailResponse | null> {
  try {
    const brand = 'One Guy Productions';
    const red500 = '#ef4444';
    const black = '#000000';
    const white = '#ffffff';

    const fromEmail = options.from ?? EnvConfig.RESEND_FROM_EMAIL ?? 'noreply@oneguyproductions.com';
    const subject = `Order #${options.orderId} — New update`;
    const preheader = `Order #${options.orderId} updated by ${options.actorLabel}.`;

    const html = `
    <!DOCTYPE html>
    <html lang="en" style="margin:0; padding:0;">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>${brand} — Order Update</title>
        <style>
          a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}

          /* Base */
          .bg-page { background:${black}; }
          .card { background:#0b0b0b; border:1px solid: ${red500}; }
          .text { color:${white}; }
          .muted { opacity:.85; }
          .link { color:${red500}; text-decoration:underline; }
          .message-box {
            background:#101010;
            border-radius:12px;
            padding:16px;
            text-align:left !important;
          }
          .btn {
            display:inline-block;
            background:${red500};
            color:${black};
            font-weight:700;
            padding:12px 16px;
            border-radius:999px;
            text-decoration:none;
          }

          /* Dark mode */
          @media (prefers-color-scheme: dark) {
            .bg-page { background:#000 !important; }
            .card { background:#0b0b0b !important; border-color:${red500} !important; }
            .text { color:#ffffff !important; }
            .message-box { background:#111 !important; }
            .link { color:${red500} !important; }
          }

          /* Outlook.com / O365 dark mode */
          [data-ogsc] .bg-page { background:#000 !important; }
          [data-ogsc] .card { background:#0b0b0b !important; border-color:${red500} !important; }
          [data-ogsc] .text { color:#ffffff !important; }
          [data-ogsc] .message-box { background:#111 !important; }
          [data-ogsc] .link { color:${red500} !important; }
        </style>
      </head>
      <body class="bg-page" style="margin:0; padding:0; background:${black}; color:${white}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <!-- Preheader (hidden) -->
        <div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0; color:transparent;">
          ${preheader}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
                <tr>
                  <td style="padding:0 8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" style="border-radius:16px; overflow:hidden;">
                      <!-- Header -->
                      <tr>
                        <td style="background:${red500}; padding:14px 20px;">
                          <table role="presentation" width="100%">
                            <tr>
                              <td style="font-size:18px; font-weight:700; color:${black}; letter-spacing:.3px;">${brand}</td>
                              <td align="right" style="font-size:12px; color:${black}; opacity:.85;">Order Update</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td class="text" style="padding:28px 24px 10px 24px;">
                          <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.3; font-weight:700;">New update on your order</h2>
                          <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">We’ve added a new comment or status to your order.</p>

                          <!-- Meta -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px 0;">
                            <tr>
                              <td style="padding:6px 0; font-size:15px;">
                                <strong style="opacity:.9;">Order:</strong> <span style="opacity:.95;">#${options.orderId}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0; font-size:15px;">
                                <strong style="opacity:.9;">From:</strong> <span style="opacity:.95;">${options.actorLabel}</span>
                              </td>
                            </tr>
                          </table>

                          <!-- Message preview (force left alignment at TD level) -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px 0;">
                            <tr>
                              <td align="left" style="text-align:left !important; padding:0;">
                                <div class="message-box" style="white-space:pre-wrap; word-break:break-word; color:${white}; text-align:left !important;">
                                  ${options.bodyPreview}
                                </div>
                              </td>
                            </tr>
                          </table>

                          <!-- CTA -->
                          <p style="margin:16px 0 0 0;">
                            <a href="${options.orderUrl}"
                               class="btn"
                               style="background:${red500}; color:${black}; font-weight:700; padding:12px 16px; border-radius:999px; text-decoration:none;">
                              Open Order #${options.orderId}
                            </a>
                          </p>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding:10px 24px 0 24px;">
                          <hr style="border:none; height:1px; background:${red500}; opacity:.4;" />
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td class="text" style="padding:14px 24px 24px 24px;">
                          <p style="margin:0; font-size:12px; line-height:1.6; opacity:.8;">
                            You’re receiving this because you’re associated with Order #${options.orderId}.
                          </p>
                          <p style="margin:8px 0 0 0; font-size:12px; line-height:1.6; opacity:.6;">
                            © ${new Date().getFullYear()} ${brand}. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;

    return await sendEmail({ from: fromEmail, to: options.to, subject, html });
  } catch (err) {
    console.error('❌ Failed to send order update notification email:', err);
    return null;
  }
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

  const brand = 'One Guy Productions';
  const red500 = '#ef4444';
  const black = '#000000';
  const white = '#ffffff';

  const preheader = `New contact message from ${data.name} <${data.email}>`;

  const html = `
  <!DOCTYPE html>
  <html lang="en" style="margin:0; padding:0;">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${brand} — New Contact Message</title>
      <style>
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

        /* Base */
        .bg-page { background:${black}; }
        .card { background:#0b0b0b; border:1px solid ${red500}; }
        .text { color:${white}; }
        .muted { opacity:.85; }
        .link { color:${red500}; text-decoration:underline; }
        .message-box {
          background:#101010;
          border-radius:12px;
          padding:16px;
          text-align:left !important;
        }
        .btn {
          display:inline-block;
          background:${red500};
          color:${black};
          font-weight:700;
          padding:12px 16px;
          border-radius:999px;
          text-decoration:none;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .bg-page { background:#000 !important; }
          .card { background:#0b0b0b !important; border-color:${red500} !important; }
          .text { color:#ffffff !important; }
          .message-box { background:#111 !important; }
          .link { color:${red500} !important; }
        }

        /* Outlook.com / O365 dark mode */
        [data-ogsc] .bg-page { background:#000 !important; }
        [data-ogsc] .card { background:#0b0b0b !important; border-color:${red500} !important; }
        [data-ogsc] .text { color:#ffffff !important; }
        [data-ogsc] .message-box { background:#111 !important; }
        [data-ogsc] .link { color:${red500} !important; }
      </style>
    </head>
    <body class="bg-page" style="margin:0; padding:0; background:${black}; color:${white}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <!-- Preheader -->
      <div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0; color:transparent;">
        ${preheader}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
              <tr>
                <td style="padding:0 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" style="border-radius:16px; overflow:hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background:${red500}; padding:14px 20px;">
                        <table role="presentation" width="100%">
                          <tr>
                            <td style="font-size:18px; font-weight:700; color:${black}; letter-spacing:.3px;">${brand}</td>
                            <td align="right" style="font-size:12px; color:${black}; opacity:.85;">New Contact Message</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td class="text" style="padding:28px 24px 10px 24px;">
                        <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.3; font-weight:700;">You’ve received a new message</h2>
                        <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">Submitted via your contact form.</p>

                        <!-- Meta -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px 0;">
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Name:</strong> <span style="opacity:.95;">${data.name}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:6px 0; font-size:15px;">
                              <strong style="opacity:.9;">Email:</strong>
                              <a href="mailto:${data.email}" class="link" style="color:${red500}; text-decoration:underline;">${data.email}</a>
                            </td>
                          </tr>
                        </table>

                        <!-- Message -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px 0;">
                          <tr>
                            <td align="left" style="text-align:left !important; padding:0;">
                              <div class="message-box" style="white-space:pre-wrap; word-break:break-word; color:${white}; text-align:left !important;">
                                ${autoLinkedMessage}
                              </div>
                            </td>
                          </tr>
                        </table>

                        <!-- CTA -->
                        <p style="margin:16px 0 0 0;">
                          <a href="mailto:${data.email}?subject=Re:%20Your%20message%20to%20${encodeURIComponent(brand)}"
                             class="btn" style="background:${red500}; color:${black}; font-weight:700; padding:12px 16px; border-radius:999px; text-decoration:none;">
                            Reply to ${data.name}
                          </a>
                        </p>
                      </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                      <td style="padding:10px 24px 0 24px;">
                        <hr style="border:none; height:1px; background:${red500}; opacity:.4;" />
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td class="text" style="padding:14px 24px 24px 24px;">
                        <p style="margin:0; font-size:12px; line-height:1.6; opacity:.8;">
                          This message was sent from the contact form on oneguyproductions.com.
                        </p>
                        <p style="margin:8px 0 0 0; font-size:12px; line-height:1.6; opacity:.6;">
                          © ${new Date().getFullYear()} ${brand}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({
    from: EnvConfig.RESEND_FROM_EMAIL ?? EnvConfig.EMAIL_FROM_CONTACT ?? '',
    to: EnvConfig.RESEND_CONTACT_RECEIVER_EMAIL ?? EnvConfig.RESEND_TO_EMAIL ?? '',
    subject: `New Contact Message from ${data.name}`,
    html,
  });
}



export async function sendOtpEmail(email: string, otp: string): Promise<CreateEmailResponse> {
  const brand = 'One Guy Productions';
  const red500 = '#ef4444';
  const black = '#000000';
  const white = '#ffffff';

  const preheader = `Your OTP code is ${otp}. It expires in 5 minutes.`;

  const html = `
  <!DOCTYPE html>
  <html lang="en" style="margin:0; padding:0;">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <!-- Tell clients we support dark mode -->
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>${brand} OTP Code</title>
      <style>
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

        /* Base (light + most clients) */
        .bg-page { background:${black}; }
        .card { background:#0b0b0b; border:1px solid ${red500}; }
        .text { color:${white}; }
        .otp-box {
          background:${black};
          border:2px dashed ${red500};
          border-radius:12px;
          padding:18px 16px;
        }
        .otp-text {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size:32px;
          letter-spacing:6px;
          line-height:1;
          color:${white};
          font-weight:800;
          text-shadow: 0 1px 0 rgba(0,0,0,.6);
        }

        /* System dark mode */
        @media (prefers-color-scheme: dark) {
          .bg-page { background:#000 !important; }
          .card { background:#0b0b0b !important; border-color:${red500} !important; }
          .text { color:#ffffff !important; }
          .otp-box { background:#111 !important; border-color:${red500} !important; }
          .otp-text { color:#ffffff !important; text-shadow: 0 1px 0 rgba(0,0,0,.8) !important; }
        }

        /* Outlook.com / Office 365 dark mode */
        [data-ogsc] .bg-page { background:#000 !important; }
        [data-ogsc] .card { background:#0b0b0b !important; border-color:${red500} !important; }
        [data-ogsc] .text { color:#ffffff !important; }
        [data-ogsc] .otp-box { background:#111 !important; border-color:${red500} !important; }
        [data-ogsc] .otp-text { color:#ffffff !important; text-shadow: 0 1px 0 rgba(0,0,0,.8) !important; }
      </style>
    </head>
    <body class="bg-page" style="margin:0; padding:0; background:${black}; color:${white}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <!-- Preheader (hidden) -->
      <div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0; color:transparent;">
        ${preheader}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
              <tr>
                <td style="padding:0 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" style="border-radius:16px; overflow:hidden;">
                    <tr>
                      <td style="background:${red500}; padding:14px 20px;">
                        <table role="presentation" width="100%">
                          <tr>
                            <td class="text" style="font-size:18px; font-weight:700; color:${black}; letter-spacing:.3px;">${brand}</td>
                            <td align="right" class="text" style="font-size:12px; color:${black}; opacity:.85;">Security Notification</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="text" style="padding:28px 24px 10px 24px;">
                        <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.3; font-weight:700;">Your One‑Time Password (OTP)</h2>
                        <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">Use the code below to reset your password. For your security, this code expires in <strong>5 minutes</strong>.</p>
                        <table role="presentation" width="100%" style="margin:16px 0 12px 0;">
                          <tr>
                            <td align="center" class="otp-box">
                              <div class="otp-text">${otp}</div>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:12px 0 0 0; font-size:14px; line-height:1.6; opacity:.9;">Didn’t request this? You can safely ignore this email. Your account remains secure.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 24px 0 24px;">
                        <hr style="border:none; height:1px; background:${red500}; opacity:.4;" />
                      </td>
                    </tr>
                    <tr>
                      <td class="text" style="padding:14px 24px 24px 24px;">
                        <p style="margin:0; font-size:12px; line-height:1.6; opacity:.8;">If the button or code doesn’t work, try copying the code manually within 5 minutes.</p>
                        <p style="margin:8px 0 0 0; font-size:12px; line-height:1.6; opacity:.6;">© ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  return await sendEmail({
    from: EnvConfig.RESEND_FROM_EMAIL ?? 'noreply@oneguyproductions.com',
    to: email,
    subject: 'Your OTP Code for One Guy Productions',
    html,
  });
}

