import { User, Order } from '../models/index.js';
import { sendEmail } from './resend.service.js';
import { EnvConfig } from '../config/env.config.js';

interface NotifyParams {
  orderId: number;
  actorUserId: number | null;
  targetUserId: number;
  bodyPreview: string;
}

export async function notifyOrderUpdate(params: NotifyParams): Promise<boolean> {
  const { orderId, actorUserId, targetUserId, bodyPreview } = params;

  try {
    const [order, target, actor] = await Promise.all([
      Order.findByPk(orderId),
      User.findByPk(targetUserId),
      actorUserId ? User.findByPk(actorUserId) : Promise.resolve(null),
    ]);

    if (!order) {
      console.warn('notifyOrderUpdate: order not found', { orderId });
      return false;
    }

    const toEmail: string | null = target?.email ?? null;
    if (!toEmail) {
      console.warn('notifyOrderUpdate: target user/email missing', { targetUserId });
      return false;
    }

    const fromEmail: string =
      EnvConfig.RESEND_FROM_EMAIL ??
      EnvConfig.EMAIL_FROM_ORDER ??
      'noreply@oneguyproductions.com';

    const brand = 'One Guy Productions';
    const red500 = '#ef4444';
    const black = '#000000';
    const white = '#ffffff';

    const actorLabel: string = actor?.email ?? brand;
    const subject = `Order #${order.id} — New update`;
    const safePreview: string = String(bodyPreview || '').slice(0, 240);

    const base = EnvConfig.PUBLIC_BASE_URL ?? 'https://www.oneguyproductions.com';
    const portalPath = `/portal?openOrder=${encodeURIComponent(String(order.id))}`;
    const orderUrl: string = `${base}/auth?returnTo=${encodeURIComponent(portalPath)}`;

    const preheader = `Order #${order.id} updated by ${actorLabel}.`;

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
          @media (prefers-color-scheme: dark) {
            .bg-page { background:#000 !important; }
            .card { background:#0b0b0b !important; border-color:${red500} !important; }
            .text { color:#ffffff !important; }
            .message-box { background:#111 !important; }
            .link { color:${red500} !important; }
          }
          [data-ogsc] .bg-page { background:#000 !important; }
          [data-ogsc] .card { background:#0b0b0b !important; border-color:${red500} !important; }
          [data-ogsc] .text { color:#ffffff !important; }
          [data-ogsc] .message-box { background:#111 !important; }
          [data-ogsc] .link { color:${red500} !important; }
        </style>
      </head>
      <body class="bg-page" style="margin:0; padding:0; background:${black}; color:${white}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
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

                      <tr>
                        <td class="text" style="padding:28px 24px 10px 24px;">
                          <h2 style="margin:0 0 8px 0; font-size:22px; line-height:1.3; font-weight:700;">New update on your order</h2>
                          <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">We’ve added a new comment or status to your order.</p>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px 0;">
                            <tr>
                              <td style="padding:6px 0; font-size:15px;">
                                <strong style="opacity:.9;">Order:</strong> <span style="opacity:.95;">#${order.id}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0; font-size:15px;">
                                <strong style="opacity:.9;">From:</strong> <span style="opacity:.95;">${actorLabel}</span>
                              </td>
                            </tr>
                          </table>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px 0;">
                            <tr>
                              <td align="left" style="text-align:left !important; padding:0;">
                                <div class="message-box" style="white-space:pre-wrap; word-break:break-word; color:${white}; text-align:left !important;">
                                  ${escapeHtml(safePreview)}
                                </div>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:16px 0 0 0;">
                            <a href="${orderUrl}" target="_blank" rel="noopener"
                               class="btn" style="background:${red500}; color:${black}; font-weight:700; padding:12px 16px; border-radius:999px; text-decoration:none;">
                              Open Order #${order.id}
                            </a>
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 24px 0 24px;">
                          <hr style="border:none; height:1px; background:${red500}; opacity:.4;" />
                        </td>
                      </tr>

                      <tr>
                        <td class="text" style="padding:14px 24px 24px 24px;">
                          <p style="margin:0; font-size:12px; line-height:1.6; opacity:.8;">
                            You’re receiving this because you’re associated with Order #${order.id} on ${brand}.
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

    const { data, error } = await sendEmail({
      from: fromEmail,
      to: toEmail,
      subject,
      html,
    });

    if (error) {
      console.warn('notifyOrderUpdate: Resend returned an error', { orderId, targetUserId, error });
      return false;
    }
    if (!data?.id) {
      console.warn('notifyOrderUpdate: Resend response missing data.id', { orderId, targetUserId, data });
      return false;
    }
    return true;
  } catch (err) {
    console.error('notifyOrderUpdate: unexpected failure', err);
    return false;
  }
}

/** Minimal HTML escaper to avoid breaking the email markup */
function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
