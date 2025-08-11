import type { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Order, OrderUpdate, User } from '../models/index.js';
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
  updatedAt: string;
  latestUpdateAt: string | null;
  unreadCount: number;
  ageHours: number;
}

export interface AdminOrdersResponse {
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
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

  if (!Number.isFinite(viewerId)) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const qs = req.query as Record<string, string>;
  const { p, ps } = parsePagination(qs);
  const where = buildWhere(qs);

  try {
    const svc = await getAdminOrdersWithUnread(viewerId, where, p, ps);

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

export async function getOrderThread(req: Request, res: Response): Promise<void> {
  const orderIdNum = Number(req.params.orderId);
  if (!Number.isFinite(orderIdNum)) { res.status(400).json({ error: 'Invalid request.' }); return; }

  try {
    const updates = await OrderUpdate.findAll({
      where: { orderId: orderIdNum },
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
          attributes: ['id', 'email'],
          required: false,
        },
      ],
    });

    const order = await Order.findByPk(orderIdNum, {
      attributes: [
        'id',
        'name',
        'email',
        'businessName',
        'projectType',
        'budget',
        'timeline',
        'description',
        'customerId',
        'status',
        'assignedAdminId',
        'createdAt',
        'updatedAt',
      ],
    });

    const mapped = updates.map(u => ({
      id: u.id,
      orderId: u.orderId,
      authorUserId: u.authorUserId ?? null,
      authorEmail: (u as any).author?.email ?? null,
      body: (u as any).body ?? '',
      source: (u as any).source ?? 'web',
      eventType: (u as any).eventType ?? 'comment',
      requiresCustomerResponse: Boolean((u as any).requiresCustomerResponse),
      createdAt: (u.createdAt ?? new Date()).toISOString(),
    }));

    const orderPayload = order
      ? {
        id: order.id,
        name: (order as any).name ?? '',
        email: (order as any).email ?? '',
        businessName: (order as any).businessName ?? '',
        projectType: (order as any).projectType ?? '',
        budget: (order as any).budget ?? '',
        timeline: (order as any).timeline ?? '',
        description: (order as any).description ?? '',
        customerId: (order as any).customerId ?? null,
        status: (order as any).status as OrderStatus,
        assignedAdminId: (order as any).assignedAdminId ?? null,
        createdAt: (order.createdAt ?? new Date()).toISOString(),
        updatedAt: (order.updatedAt ?? order.createdAt ?? new Date()).toISOString(),
      }
      : {
        id: orderIdNum,
        name: '',
        email: '',
        businessName: '',
        projectType: '',
        budget: '',
        timeline: '',
        description: '',
        customerId: null,
        status: 'pending' as OrderStatus,
        assignedAdminId: null,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      };

    const canPost = orderPayload.status !== 'cancelled' && orderPayload.status !== 'complete';

    res.json({ order: orderPayload, updates: mapped, canPost });
  } catch (err) {
    console.error('getOrderThread failed', err);
    res.status(500).json({ error: 'Failed to load thread.' });
  }
}

export async function setOrderStatus(req: Request, res: Response): Promise<void> {
  const orderIdNum = Number(req.params.orderId);
  const next = String(req.body?.status ?? '').trim() as OrderStatus;
  const actorId = Number((req as any).user?.id) || null;

  if (!Number.isFinite(orderIdNum) || !next) {
    res.status(400).json({ ok: false, message: 'Invalid order id or status' });
    return;
  }

  const result = await svcSetStatus(orderIdNum, next, actorId);
  if (!result.ok) {
    res.status(400).json({ ok: false, message: result.message ?? 'Unable to set status' });
    return;
  }

  res.json({ ok: true, data: { orderId: orderIdNum, status: next } });
}

export async function assignOrderToAdmin(req: Request, res: Response): Promise<void> {
  const orderIdNum = Number(req.params.orderId);
  const adminIdNum = Number(req.body?.assignedAdminId);
  const actorId = Number((req as any).user?.id) || null;

  if (!Number.isFinite(orderIdNum) || !Number.isFinite(adminIdNum)) {
    res.status(400).json({ ok: false, message: 'Invalid order id or admin id' });
    return;
  }

  const result = await svcAssignToAdmin(orderIdNum, adminIdNum, actorId);
  if (!result.ok) {
    res.status(400).json({ ok: false, message: result.message ?? 'Unable to assign order' });
    return;
  }

  res.json({ ok: true, data: { orderId: orderIdNum, assignedAdminId: adminIdNum } });
}
