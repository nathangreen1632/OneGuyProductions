import type { Request, Response } from 'express';
import { Order, User } from '../models/index.js';
import type { OrderInstance } from '../models/order.model.js';
import { sanitizeBody } from '../services/contentSafety.service.js';
import { notifyOrderUpdate } from '../services/notification.service.js';
import type { CreateCommentUpdateResult } from '../services/orderUpdate.service.js';

export function parseAndValidateIds(
  req: Request,
  res: Response
): { orderIdNum: number; actorUserId: number } | null {
  const orderIdNum = Number(req.params.orderId);
  const actorUserId = Number((req as any)?.user?.id);

  if (!Number.isFinite(orderIdNum) || !Number.isFinite(actorUserId)) {
    res.status(400).json({ error: 'Invalid request.' });
    return null;
  }
  return { orderIdNum, actorUserId };
}

export function sanitizeAndValidateBody(rawBody: unknown, res: Response): string | null {
  const raw = typeof rawBody === 'string' ? rawBody.trim() : '';
  if (!raw) {
    res.status(400).json({ error: 'Message body is required.' });
    return null;
  }
  const safe = sanitizeBody(raw).trim();
  if (!safe) {
    res.status(400).json({ error: 'Message body is required.' });
    return null;
  }
  return safe;
}

type UserEmailOnly = { email?: string | null } | null;

export async function fetchActorAndOrder(
  actorUserId: number,
  orderIdNum: number
): Promise<{ actor: UserEmailOnly; order: OrderInstance | null }> {
  const [actor, order] = await Promise.all([
    User.findByPk(actorUserId),
    Order.findByPk(orderIdNum),
  ]);

  const actorEmailOnly: UserEmailOnly = actor
    ? { email: (actor as any).email as string | null | undefined }
    : null;
  return { actor: actorEmailOnly, order };
}

export function deriveRoles(
  actor: UserEmailOnly,
  order: OrderInstance | null,
  actorUserId: number
): { isAdmin: boolean; isOwner: boolean } {
  const actorEmail: string = (actor?.email ?? '').toLowerCase();
  const isAdmin: boolean = actorEmail.endsWith('@oneguyproductions.com');
  const isOwner: boolean = order ? Number(order.customerId) === actorUserId : false;
  return { isAdmin, isOwner };
}

export function ensureAuthorized(isAdmin: boolean, isOwner: boolean, res: Response): boolean {
  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: 'Not authorized for this order.' });
    return false;
  }
  return true;
}

export function finalRequiresCustomerResponseFlag(requested: unknown, isAdmin: boolean): boolean {
  return isAdmin ? Boolean(requested) : false;
}

type UpdateError = 'NOT_FOUND' | 'ORDER_CLOSED' | 'RATE_LIMIT' | 'VALIDATION_ERROR' | 'FK_VIOLATION' | 'DB_ERROR';

export function handleCreateUpdateError(
  res: Response,
  result: CreateCommentUpdateResult | undefined | null
): boolean {
  if (result?.ok) return false;
  const code: UpdateError = result?.code ?? 'DB_ERROR';

  switch (code) {
    case 'NOT_FOUND':
      res.status(404).json({ error: 'Order not found.' });
      return true;
    case 'ORDER_CLOSED':
      res.status(409).json({ error: 'Order is closed or cancelled.' });
      return true;
    case 'RATE_LIMIT':
      res.status(429).json({ error: 'Please wait before posting another update.' });
      return true;
    case 'VALIDATION_ERROR':
      res.status(400).json({ error: result?.message ?? 'Invalid update.' });
      return true;
    case 'FK_VIOLATION':
    case 'DB_ERROR':
    default:
      res.status(500).json({ error: 'Failed to add update.' });
      return true;
  }
}

export function resolveTargetUserId(
  isAdmin: boolean,
  order: OrderInstance | null
): number | undefined {
  if (!order) return undefined;
  const rawTarget: number | null | undefined = isAdmin ? order.customerId : order.assignedAdminId;
  return typeof rawTarget === 'number' && Number.isFinite(rawTarget) && rawTarget > 0 ? rawTarget : undefined;
}

export async function safeNotify(
  orderId: number,
  actorUserId: number,
  targetUserId: number | undefined,
  bodyPreview: string
): Promise<void> {
  if (typeof targetUserId !== 'number') return;
  try {
    await notifyOrderUpdate({
      orderId,
      actorUserId,
      targetUserId,
      bodyPreview,
    });
  } catch {

  }
}
