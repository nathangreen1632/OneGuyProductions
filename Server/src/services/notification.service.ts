// services/notification.service.ts
import { User, Order } from '../models/index.js';
import { sendEmail } from './resend.service.js';
import { EnvConfig } from '../config/env.config.js';

interface NotifyParams {
  orderId: number;
  actorUserId: number | null; // sender; may be null (system)
  targetUserId: number;       // who should be notified
  bodyPreview: string;
}

/**
 * Sends an email notification to targetUserId that an order received a new update.
 * - Uses Resend under the hood (CreateEmailResponse shape: { data?: { id }, error?: ... }).
 * - Gracefully no-ops if target user or email is missing.
 * - Returns boolean for success/failure (no throws).
 */
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

    // Sonar S6582: use optional chaining and narrow via local const
    const toEmail = target?.email ?? null;
    if (!toEmail) {
      console.warn('notifyOrderUpdate: target user/email missing', { targetUserId });
      return false;
    }

    const fromEmail =
      EnvConfig.RESEND_FROM_EMAIL ??
      EnvConfig.EMAIL_FROM_ORDER ??
      'noreply@oneguyproductions.com';

    const actorLabel = actor?.email ?? 'One Guy Productions';
    const subject = `Order #${order.id} — New update`;
    const safePreview = String(bodyPreview || '').slice(0, 240);
    const orderUrl =
      (EnvConfig.PUBLIC_BASE_URL ?? 'http://localhost:3002') + `/orders/${order.id}`;

    const html = `
      <html lang="en-US">
        <head><meta charset="UTF-8" /></head>
        <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-size: 16px; line-height: 1.5;">
          <h2 style="margin:0 0 12px;">New update on your order</h2>
          <p style="margin:0 0 8px;"><strong>Order:</strong> #${order.id}</p>
          <p style="margin:0 0 8px;"><strong>From:</strong> ${actorLabel}</p>
          <p style="margin:16px 0 8px;"><strong>Message preview:</strong></p>
          <blockquote style="margin:0; padding:12px 16px; background:#f6f6f6; border-left:4px solid #999; white-space:pre-wrap;">
            ${escapeHtml(safePreview)}
          </blockquote>
          <p style="margin:16px 0;">View the full thread and reply here:</p>
          <p style="margin:0;">
            <a href="${orderUrl}" target="_blank" rel="noopener" style="display:inline-block; padding:10px 14px; text-decoration:none; background:#000; color:#fff; border-radius:6px;">
              Open Order #${order.id}
            </a>
          </p>
          <p style="margin:20px 0 0; font-size:13px; color:#666;">
            You’re receiving this because you’re associated with this order on One Guy Productions.
          </p>
        </body>
      </html>
    `;

    // Resend returns: { data?: { id: string, ... } | null, error?: ResendError | null }
    const response = await sendEmail({
      from: fromEmail,
      to: toEmail, // uses narrowed email
      subject,
      html,
    });

    const { data, error } = response;

    if (error) {
      console.warn('notifyOrderUpdate: Resend returned an error', { orderId, targetUserId, error });
      return false;
    }

    if (!data?.id) {
      // No hard fail; just log and return false to indicate we didn’t confirm delivery id
      console.warn('notifyOrderUpdate: Resend response missing data.id', { orderId, targetUserId, data });
      return false;
    }

    // Success (we have a message id)
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
