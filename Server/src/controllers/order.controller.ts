import type { Request, Response } from 'express';
import { handleNewOrder } from '../services/order.service.js';
import { HandleOrderResult, validOrderStatuses } from '../types/order.types.js';
import { Order, OrderUpdate, User } from '../models/index.js';
import { isWithin72Hours } from '../utils/time.js';
import { generatePdfBuffer } from '../services/pdf.service.js';
import type { OrderStatus } from '../types/order.types.js';
import { OrderInstance } from '../models/order.model.js';
import {createCommentUpdate } from '../services/orderUpdate.service.js';
import { markOneRead, markAllRead } from '../services/readReceipt.service.js';
import { getCustomerOrdersWithUnread, getInboxForUser } from '../services/inbox.service.js';
import { ingestEmailReply } from '../services/emailIngest.service.js';
import { sanitizeBody } from '../services/contentSafety.service.js';
import {OrderUpdateModel} from "../models/orderUpdate.model.js";
import {
  parseAndValidateIds,
  sanitizeAndValidateBody,
  fetchActorAndOrder,
  deriveRoles,
  ensureAuthorized,
  finalRequiresCustomerResponseFlag,
  handleCreateUpdateError,
  resolveTargetUserId,
  safeNotify,
} from '../utils/orderUpdate.helpers.js';

export async function submitOrder(req: Request, res: Response): Promise<void> {
  const {
    name,
    email,
    businessName,
    projectType,
    budget,
    timeline,
    description,
    captchaToken,
  } = req.body;

  if (!name || !email || !projectType || !budget || !description || !captchaToken) {
    console.warn('⚠️ Missing required fields in request:', {
      name,
      email,
      projectType,
      budget,
      description,
      captchaTokenExists: !!captchaToken,
    });
    res.status(400).json({ error: 'Missing required fields or CAPTCHA token' });
    return;
  }

  try {
    const user: User | null = await User.findOne({ where: { email } });
    const customerId: number | null = user?.id || null;
    const unknownEmail: boolean = !user;

    if (!user) {
      console.warn(`🟡 Proceeding without linked user for email: ${email}`);
    }

    const result: HandleOrderResult = await handleNewOrder({
      name,
      email,
      businessName,
      projectType,
      budget,
      timeline,
      description,
      customerId,
    });

    if (!result.dbSuccess) {
      console.error('❌ Order was not saved to database.');
      res.status(500).json({ error: 'Order could not be saved to the database.' });
      return;
    }

    if (!result.emailSuccess) {
      console.warn('⚠️ Order saved but email failed.');
      res.status(200).json({
        success: true,
        warning: 'Order was saved, but confirmation email failed to send.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order submitted and confirmation sent.',
      orderId: result.orderId ?? null,
      unknownEmail,
    });
  } catch (err) {
    console.error('🧨 Unexpected error during order submission:', err);
    res.status(500).json({ error: 'Server error while submitting order.' });
  }
}

export async function linkOrderToCurrentUser(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const orderId: number = Number(req.params.id);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  try {
    const order: OrderInstance | null = await Order.findOne({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.customerId && order.customerId !== Number(userId)) {
      res.status(409).json({ error: 'Order already linked to a different user.' });
      return;
    }

    await order.update({ customerId: Number(userId) });
    res.status(200).json({ success: true, message: 'Order linked to user.', orderId });
  } catch (err) {
    console.error('❌ Link Order Error:', err);
    res.status(500).json({ error: 'Failed to link order to user.' });
  }
}

export async function updateOrder(req: Request, res: Response): Promise<void> {
  const userId: any = (req as any).user?.id;
  const orderId: number = parseInt(req.params.id, 10);
  const { businessName, projectType, budget, timeline, description } = req.body;

  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (Number.isNaN(orderId)) { res.status(400).json({ error: 'Invalid order ID.' }); return; }

  try {
    const order: OrderInstance | null = await Order.findOne({ where: { id: orderId, customerId: userId } });
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }

    if (!isWithin72Hours(order.createdAt.toISOString())) {
      res.status(403).json({ error: 'Order can no longer be edited.' });
      return;
    }

    await order.update({ businessName, projectType, budget, timeline, description });

    const updated: OrderInstance | null = await Order.findOne({
      where: { id: orderId, customerId: userId },
      include: [{ model: OrderUpdate, as: 'updates' }],
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error('❌ Update Order Error:', err);
    res.status(500).json({ error: 'Failed to update order.' });
  }
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  const userId: any = (req as any).user?.id;
  const orderId: number = parseInt(req.params.id, 10);

  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (isNaN(orderId)) { res.status(400).json({ error: 'Invalid order ID.' }); return; }

  try {
    const order: OrderInstance | null = await Order.findOne({ where: { id: orderId, customerId: userId } });
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }

    if (!order.createdAt || !isWithin72Hours(order.createdAt.toISOString())) {
      res.status(403).json({ error: 'Order can no longer be cancelled.' });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(409).json({ error: 'Order already cancelled.' });
      return;
    }

    const nextStatus: OrderStatus = 'cancelled';
    if (!validOrderStatuses.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }

    await order.update({ status: nextStatus });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      orderId,
      status: 'cancelled',
    });
  } catch (err) {
    console.error('❌ Cancel Order Error:', err);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
}

export async function downloadInvoice(req: Request, res: Response): Promise<void> {
  const userId: any = (req as any).user?.id;
  const orderId: number = parseInt(req.params.id, 10);

  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const order: OrderInstance | null = await Order.findOne({ where: { id: orderId, customerId: userId } });
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }

    const pdfBuffer: Buffer<ArrayBufferLike> = await generatePdfBuffer(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Invoice Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate invoice.' });
  }
}


export async function addOrderUpdate(req: Request, res: Response): Promise<void> {
  const ids = parseAndValidateIds(req, res);
  if (!ids) return;
  const { orderIdNum, actorUserId } = ids;

  const { body, requiresCustomerResponse } = (req.body ?? {}) as {
    body?: string;
    requiresCustomerResponse?: boolean;
  };
  const safeBody = sanitizeAndValidateBody(body, res);
  if (!safeBody) return;

  const { actor, order } = await fetchActorAndOrder(actorUserId, orderIdNum);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const { isAdmin, isOwner } = deriveRoles(actor, order, actorUserId);
  if (!ensureAuthorized(isAdmin, isOwner, res)) return;

  const finalRCR = finalRequiresCustomerResponseFlag(requiresCustomerResponse, isAdmin);

  const result = await createCommentUpdate(orderIdNum, actorUserId, safeBody, finalRCR);
  if (handleCreateUpdateError(res, result)) return;

  const created = result?.update;

  const targetUserId = resolveTargetUserId(isAdmin, order);
  await safeNotify(orderIdNum, actorUserId, targetUserId, safeBody.slice(0, 240));

  res.status(201).json({
    id: created?.id,
    orderId: created?.orderId,
    authorUserId: created?.authorUserId,
    body: created?.body,
    requiresCustomerResponse: Boolean(created?.requiresCustomerResponse),
    createdAt: created?.createdAt,
    updatedAt: created?.updatedAt,
  });
}

export async function markOrderRead(req: Request, res: Response): Promise<void> {
  const orderIdNum: number = Number(req.params.orderId);
  const userIdNum: number = Number((req as any).user?.id);

  if (!Number.isFinite(userIdNum) || !Number.isFinite(orderIdNum)) {
    res.status(400).json({ error: 'Invalid request.' }); return;
  }

  try {
    const lastReadAt: Date = await markOneRead(userIdNum, orderIdNum);
    res.json({ ok: true, lastReadAt: lastReadAt.toISOString() });
  } catch (err) {
    console.error('markOrderRead failed', err);
    res.status(500).json({ error: 'Failed to mark read.' });
  }
}

export async function markAllOrdersRead(req: Request, res: Response): Promise<void> {
  const userIdNum: number = Number((req as any).user?.id);
  if (!Number.isFinite(userIdNum)) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    await markAllRead(userIdNum);
    res.json({ ok: true });
  } catch (err) {
    console.error('markAllOrdersRead failed', err);
    res.status(500).json({ error: 'Failed to read all.' });
  }
}

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  const userIdNum: number = Number((req as any).user?.id);
  if (!Number.isFinite(userIdNum)) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const result = await getCustomerOrdersWithUnread(userIdNum);

    const shapeHint: string = String(req.query.shape ?? req.header('x-response-shape') ?? '').toLowerCase();
    const wantFullShape: boolean =
      shapeHint === 'full' || shapeHint === 'withmeta' || shapeHint === 'with_meta' ||
      shapeHint === 'object' || shapeHint === 'new' || shapeHint === 'v2';

    if (wantFullShape) {
      res.setHeader('X-Response-Shape', 'full');
      res.status(200).json(result);
      return;
    }

    const unreadIds: string = (result.unreadOrderIds ?? []).join(',');
    const countsMap: Record<number, number> = {};
    for (const o of result.orders) countsMap[(o).id] = Number((o).unreadCount ?? 0);

    res.setHeader('X-Unread-Order-Ids', unreadIds);
    res.setHeader('X-Unread-Counts', JSON.stringify(countsMap));
    res.setHeader('X-Response-Shape', 'array');

    const expose = 'X-Unread-Order-Ids, X-Unread-Counts, X-Response-Shape';
    const existingExpose = res.getHeader('Access-Control-Expose-Headers');
    res.setHeader(
      'Access-Control-Expose-Headers',
      typeof existingExpose === 'string' && existingExpose.length > 0
        ? `${existingExpose}, ${expose}`
        : expose
    );

    res.status(200).json(result.orders);
  } catch (err) {
    console.error('getMyOrders failed', err);
    res.status(500).json({ error: 'Failed to load orders.' });
  }
}

export async function getOrderThread(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  if (!orderId || !Number.isFinite(Number(orderId))) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  try {
    const updates: OrderUpdateModel[] = await OrderUpdate.findAll({
      where: { orderId: Number(orderId) },
      order: [['createdAt', 'ASC']],
      attributes: [
        'id',
        'orderId',
        'authorUserId',
        'body',
        'source',
        'eventType',
        'requiresCustomerResponse',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'email'],
          required: false,
        },
      ],
    });

    res.status(200).json(
      updates.map((u: any) => ({
        id: u.id,
        orderId: u.orderId,
        authorUserId: u.authorUserId ?? null,
        authorUsername: u.author?.username ?? null,
        authorEmail: u.author?.email ?? null,
        body: u.body ?? '',
        source: u.source,
        eventType: u.eventType,
        requiresCustomerResponse: !!u.requiresCustomerResponse,
        createdAt: new Date(u.createdAt).toISOString(),
        updatedAt: new Date(u.updatedAt).toISOString(),
      }))
    );
  } catch (err) {
    console.error('getOrderThread failed', err);
    res.status(500).json({ error: 'Failed to load thread.' });
  }
}

export async function getInbox(req: Request, res: Response): Promise<void> {
  const userIdNum: number = Number((req as any).user?.id);
  if (!Number.isFinite(userIdNum)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 100)));
    const unreadOnly = ['1', 'true', 'yes'].includes(String(req.query.unreadOnly ?? '').toLowerCase());
    const items = await getInboxForUser(userIdNum, limit, { unreadOnly });
    res.status(200).json(items);
  } catch (err) {
    console.error('getInbox failed', err);
    res.status(500).json({ error: 'Failed to load inbox.' });
  }
}

/**
 * (Optional) If you wire an email webhook:
 * POST /api/order/:orderId/email-reply
 */
export async function addEmailReply(req: Request, res: Response): Promise<void> {
  const orderIdNum: number = Number(req.params.orderId);
  const userIdNum: number = Number((req as any).user?.id);
  const { textBody } = (req.body ?? {}) as { textBody?: string };

  if (!Number.isFinite(orderIdNum) || !Number.isFinite(userIdNum) || !textBody) {
    res.status(400).json({ error: 'Invalid request.' }); return;
  }

  try {
    const safe: string = sanitizeBody(textBody);
    const u: OrderUpdateModel = await ingestEmailReply({ orderId: orderIdNum, fromUserId: userIdNum, textBody: safe });
    res.status(201).json({ id: u.id, createdAt: u.createdAt.toISOString() });
  } catch (err) {
    console.error('addEmailReply failed', err);
    res.status(500).json({ error: 'Failed to add email reply.' });
  }
}
