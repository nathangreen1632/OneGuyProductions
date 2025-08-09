// src/controllers/admin.controller.ts
import type { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { OrderUpdate, User } from '../models/index.js';
import type { OrderStatus } from '../types/api.types.js';
import { getAdminOrdersWithUnread } from '../services/inbox.service.js';
import { setStatus as svcSetStatus, assignToAdmin as svcAssignToAdmin } from '../services/admin.service.js';



export interface AdminOrderRow {
  id: number;
  customerId: number;
  customerEmail: string;
  name: string;
  projectType: string;
  status: OrderStatus;
  assignedAdminId: number | null;
  updatedAt: string;              // ISO
  latestUpdateAt: string | null;  // ISO
  unreadCount: number;            // for the viewer (admin)
  ageHours: number;
}

export interface AdminOrdersResponse {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * GET /api/admin/orders
 * Filters (all optional): status, assignedTo ('me' | userId), unread ('true'|'false'),
 * projectType, updatedWithin ('24h'|'7d'|'30d'), q (name/email/businessName), page, pageSize
 */
export async function getAdminOrders(req: Request, res: Response): Promise<void> {
  // ── small helpers (scoped here to avoid file-wide changes) ───────────────────
  const viewerId = Number((req as any).user?.id);
  const parsePagination = (qs: Record<string, string>) => {
    const p = Math.max(parseInt(qs.page ?? '1', 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(qs.pageSize ?? '20', 10) || 20, 1), 100);
    return { p, ps };
  };
  const cutoffFrom = (v?: string): Date | null => {
    if (!v) return null;
    const now = new Date();
    const d = new Date(now);
    if (v === '24h') { d.setHours(now.getHours() - 24); return d; }
    if (v === '7d')  { d.setDate(now.getDate() - 7);    return d; }
    if (v === '30d') { d.setDate(now.getDate() - 30);   return d; }
    return null;
  };
  const buildWhere = (qs: Record<string, string>): WhereOptions => {
    const { status, projectType, updatedWithin, assignedTo, q } = qs;
    const where: WhereOptions = {};
    if (status) where['status'] = status as OrderStatus;
    if (projectType) where['projectType'] = projectType;
    const cutoff = cutoffFrom(updatedWithin);
    if (cutoff) where['updatedAt'] = { [Op.gte]: cutoff };
    if (assignedTo) {
      if (assignedTo === 'me') where['assignedAdminId'] = viewerId;
      else {
        const id = Number(assignedTo);
        if (Number.isFinite(id)) where['assignedAdminId'] = id;
      }
    }
    if (q) {
      Object.assign(where, {
        [Op.or]: [
          { name:         { [Op.iLike]: `%${q}%` } },
          { email:        { [Op.iLike]: `%${q}%` } },
          { businessName: { [Op.iLike]: `%${q}%` } },
        ],
      });
    }
    return where;
  };
  const toRow = (
    o: any,
    latestMap: Map<number, string>,
    countMap: Map<number, number>
  ): AdminOrderRow => ({
    id: o.id,
    customerId: o.customerId!,
    customerEmail: o.customer?.email ?? o.email,
    name: o.name,
    projectType: o.projectType,
    status: o.status as OrderStatus,
    assignedAdminId: o.assignedAdminId ?? null,
    updatedAt: (o.updatedAt ?? o.createdAt).toISOString(),
    latestUpdateAt: latestMap.get(o.id) ?? null,
    unreadCount: countMap.get(o.id) ?? 0,
    ageHours: Math.max(0, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 36e5)),
  });
  // ─────────────────────────────────────────────────────────────────────────────

  if (!Number.isFinite(viewerId)) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const qs = req.query as Record<string, string>;
  const { p, ps } = parsePagination(qs);
  const where = buildWhere(qs);

  try {
    const svc = await getAdminOrdersWithUnread(viewerId, where, p, ps);

    // ✅ Concrete fallbacks kill TS18048
    const orders = svc?.orders ?? [];
    const total = svc?.total ?? 0;
    const latestMap = svc?.latestMap ?? new Map<number, string>();
    const countMap = svc?.countMap ?? new Map<number, number>();

    const filtered = qs.unread === 'true'
      ? orders.filter(o => (countMap.get(o.id) ?? 0) > 0)
      : orders;

    const rows: AdminOrderRow[] = filtered.map(o => toRow(o, latestMap, countMap));
    const payload: AdminOrdersResponse = { rows, total, page: p, pageSize: ps };
    res.json(payload);
  } catch (err) {
    console.error('getAdminOrders failed', err);
    res.status(500).json({ error: 'Failed to load admin orders.' });
  }
}


/**
 * GET /api/admin/orders/:orderId/updates
 * Admin timeline (oldest → newest)
 */
export async function getOrderThread(req: Request, res: Response): Promise<void> {
  const orderIdNum = Number(req.params.orderId);
  if (!Number.isFinite(orderIdNum)) { res.status(400).json({ error: 'Invalid request.' }); return; }

  try {
    const updates = await OrderUpdate.findAll({
      where: { orderId: orderIdNum },
      order: [['createdAt', 'ASC']],
      attributes: [
        'id', 'orderId', 'authorUserId', 'body', 'source', 'eventType',
        'requiresCustomerResponse', 'createdAt', 'updatedAt', 'message', 'user'
      ],
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }],
    });

    res.json(updates.map(u => ({
      id: u.id,
      orderId: u.orderId,
      authorUserId: u.authorUserId,
      authorEmail: (u as any).author?.email ?? null,
      body: (u as any).body ?? (u as any).message ?? '',
      source: (u as any).source ?? 'web',
      eventType: (u as any).eventType ?? 'comment',
      requiresCustomerResponse: !!(u as any).requiresCustomerResponse,
      createdAt: u.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error('getOrderThread failed', err);
    res.status(500).json({ error: 'Failed to load thread.' });
  }
}

/**
 * POST /api/admin/orders/:orderId/status  { status }
 * Uses service to set status and log system update.
 */
export async function setOrderStatus(req: Request, res: Response): Promise<void> {
  const orderIdNum = Number(req.params.orderId);
  const next = (req.body?.status ?? '') as OrderStatus;

  if (!Number.isFinite(orderIdNum) || !next) { res.status(400).json({ error: 'Invalid request.' }); return; }

  try {
    await svcSetStatus(orderIdNum, next);
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') { res.status(404).json({ error: 'Order not found.' }); return; }
    console.error('setOrderStatus failed', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
}

/**
 * POST /api/admin/orders/:orderId/assign  { assignedAdminId }
 * Uses service to assign and log system update.
 */
export async function assignOrderToAdmin(req: Request, res: Response): Promise<void> {
  const orderIdNum = Number(req.params.orderId);
  const adminIdNum = Number(req.body?.assignedAdminId);

  if (!Number.isFinite(orderIdNum) || !Number.isFinite(adminIdNum)) {
    res.status(400).json({ error: 'Invalid request.' }); return;
  }

  try {
    await svcAssignToAdmin(orderIdNum, adminIdNum);
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') { res.status(404).json({ error: 'Order not found.' }); return; }
    console.error('assignOrderToAdmin failed', err);
    res.status(500).json({ error: 'Failed to assign order.' });
  }
}
