import { Op, QueryTypes } from 'sequelize';
import { Order, OrderReadReceipt, sequelize, User } from '../models/index.js';
import { OrderInstance } from '../models/order.model.js';
import { OrderReadReceiptModel } from '../models/orderReadReceipt.model.js';

export interface InboxItem {
  id: string;
  orderId: number;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export async function getCustomerOrdersWithUnread(userId: number) {
  const orders: OrderInstance[] = await Order.findAll({
    where: { customerId: userId },
    order: [['updatedAt', 'DESC']],
  });

  const ids: number[] = orders.map(o => o.id);
  if (ids.length === 0) return { orders: [], unreadOrderIds: [] as number[] };

  const recs: OrderReadReceiptModel[] = await OrderReadReceipt.findAll({ where: { userId, orderId: { [Op.in]: ids } } });
  const lastByOrder = new Map<number, Date>(recs.map(r => [r.orderId, r.lastReadAt]));

  const maxRows = await sequelize.query<{ orderId: number; latest: string }>(
    `SELECT "orderId", MAX("createdAt") AS latest
     FROM "orderUpdates"
     WHERE "orderId" IN (:ids)
     GROUP BY "orderId"`,
    { replacements: { ids }, type: QueryTypes.SELECT }
  );
  const latestMap = new Map<number, string>(maxRows.map(r => [r.orderId, new Date(r.latest).toISOString()]));

  const countRows = await sequelize.query<{ orderId: number; cnt: number }>(
    `SELECT ou."orderId", COUNT(*)::int AS cnt
     FROM "orderUpdates" ou
              LEFT JOIN "orderReadReceipts" rr
                        ON rr."orderId" = ou."orderId" AND rr."userId" = :userId
     WHERE ou."orderId" IN (:ids)
       AND (rr."lastReadAt" IS NULL OR ou."createdAt" > rr."lastReadAt")
     GROUP BY ou."orderId"`,
    { replacements: { userId, ids }, type: QueryTypes.SELECT }
  );
  const countMap = new Map<number, number>(countRows.map(r => [r.orderId, r.cnt]));

  const updateRows = await sequelize.query<{
    orderId: number;
    user: string | null;
    body: string | null;
    createdAt: string;
  }>(
    `SELECT ou."orderId",
            u."username" AS "user",
            ou."body"     AS "body",
            ou."createdAt" AS "createdAt"
     FROM "orderUpdates" ou
              LEFT JOIN "users" u ON u."id" = ou."authorUserId"
     WHERE ou."orderId" IN (:ids)
     ORDER BY ou."orderId", ou."createdAt"`,
    { replacements: { ids }, type: QueryTypes.SELECT }
  );

  const updatesByOrder = new Map<number, Array<{ user: string; timestamp: string; message: string }>>();
  for (const r of updateRows) {
    const arr = updatesByOrder.get(r.orderId) ?? [];
    arr.push({
      user: (r.user ?? 'System').toString(),
      timestamp: new Date(r.createdAt).toISOString(),
      message: (r.body ?? '').toString(),
    });
    updatesByOrder.set(r.orderId, arr);
  }

  const payload = orders.map(o => {
    const lastReadAt: Date | null = lastByOrder.get(o.id) ?? null;
    const latestUpdateAt: string | null = latestMap.get(o.id) ?? null;
    const unreadCount: number = countMap.get(o.id) ?? 0;
    const updated: Date = (o.updatedAt ?? o.createdAt);

    return {
      ...o.toJSON(),
      createdAt: o.createdAt.toISOString(),
      updatedAt: updated.toISOString(),
      lastReadAt: lastReadAt ? lastReadAt.toISOString() : null,
      latestUpdateAt,
      unreadCount,
      isUnread: unreadCount > 0,
      updates: updatesByOrder.get(o.id) ?? [],
    };
  });

  return {
    orders: payload,
    unreadOrderIds: payload.filter(p => p.isUnread).map(p => p.id),
  };
}

export async function getAdminOrdersWithUnread(
  viewerId: number,
  where: any,
  page: number,
  pageSize: number
) {
  const { rows: orders, count: total } = await Order.findAndCountAll({
    where,
    include: [{ model: User, as: 'customer', attributes: ['id', 'email'] }],
    order: [['updatedAt', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  const ids: number[] = orders.map(o => o.id);
  if (ids.length === 0) {
    return {
      orders: [],
      total,
      latestMap: new Map<number, string>(),
      countMap: new Map<number, number>(),
    };
  }

  const maxRows = await sequelize.query<{ orderId: number; latest: string }>(
    `SELECT "orderId", MAX("createdAt") AS latest
     FROM "orderUpdates"
     WHERE "orderId" IN (:ids)
     GROUP BY "orderId"`,
    { replacements: { ids }, type: QueryTypes.SELECT }
  );
  const latestMap = new Map<number, string>(maxRows.map(r => [r.orderId, new Date(r.latest).toISOString()]));

  const countRows = await sequelize.query<{ orderId: number; cnt: number }>(
    `SELECT ou."orderId", COUNT(*)::int AS cnt
     FROM "orderUpdates" ou
              LEFT JOIN "orderReadReceipts" rr
                        ON rr."orderId" = ou."orderId" AND rr."userId" = :viewerId
     WHERE ou."orderId" IN (:ids)
       AND (rr."lastReadAt" IS NULL OR ou."createdAt" > rr."lastReadAt")
     GROUP BY ou."orderId"`,
    { replacements: { viewerId, ids }, type: QueryTypes.SELECT }
  );
  const countMap = new Map<number, number>(countRows.map(r => [r.orderId, r.cnt]));

  return { orders, total, latestMap, countMap };
}

export async function getInboxForUser(
  userId: number,
  limit: number = 100,
  opts?: { unreadOnly?: boolean }
): Promise<InboxItem[]> {
  const rows = await sequelize.query<{
    updateId: number;
    orderId: number;
    body: string | null;
    eventType: string;
    createdAt: string;
    lastReadAt: string | null;
  }>(
    `
        SELECT
            ou."id"         AS "updateId",
            ou."orderId"    AS "orderId",
            ou."body"       AS "body",
            ou."eventType"  AS "eventType",
            ou."createdAt"  AS "createdAt",
            rr."lastReadAt" AS "lastReadAt"
        FROM "orderUpdates" ou
                 JOIN "orders" o
                      ON o."id" = ou."orderId" AND o."customerId" = :userId
                 LEFT JOIN "orderReadReceipts" rr
                           ON rr."orderId" = ou."orderId" AND rr."userId" = :userId
        ORDER BY ou."createdAt" DESC
        LIMIT :limit
    `,
    { replacements: { userId, limit }, type: QueryTypes.SELECT }
  );

  const items: InboxItem[] = rows.map((r) => {
    const created = new Date(r.createdAt);
    const lastRead = r.lastReadAt ? new Date(r.lastReadAt) : null;
    const read = !!(lastRead && created <= lastRead);

    const title =
      r.eventType === 'status'
        ? `Order #${r.orderId} status changed`
        : `Update on Order #${r.orderId}`;

    const raw = (r.body ?? '').trim();
    const snippet = raw.length > 180 ? `${raw.slice(0, 177)}…` : raw;

    return {
      id: `upd-${r.updateId}`,
      orderId: r.orderId,
      title,
      message: snippet,
      createdAt: created.toISOString(),
      read,
    };
  });

  return opts?.unreadOnly ? items.filter(i => !i.read) : items;
}
