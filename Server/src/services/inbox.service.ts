import { Op, QueryTypes } from 'sequelize';
import { Order, OrderReadReceipt, sequelize, User } from '../models/index.js';

export async function getCustomerOrdersWithUnread(userId: number) {
  const orders = await Order.findAll({
    where: { customerId: userId },
    order: [['updatedAt', 'DESC']],
  });

  const ids = orders.map(o => o.id);
  if (ids.length === 0) return { orders: [], unreadOrderIds: [] as number[] };

  const recs = await OrderReadReceipt.findAll({ where: { userId, orderId: { [Op.in]: ids } } });
  const lastByOrder = new Map<number, Date>(recs.map(r => [r.orderId, r.lastReadAt]));

  // latest update timestamps
  const maxRows = await sequelize.query<{ orderId: number; latest: string }>(
    `SELECT "orderId", MAX("createdAt") AS latest
     FROM "orderUpdates"
     WHERE "orderId" IN (:ids)
     GROUP BY "orderId"`,
    { replacements: { ids }, type: QueryTypes.SELECT }
  );
  const latestMap = new Map<number, string>(maxRows.map(r => [r.orderId, new Date(r.latest).toISOString()]));

  // unread counts
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

  // timeline updates (align to new schema)
  const updateRows = await sequelize.query<{
    orderId: number;
    user: string | null;
    body: string | null;
    createdAt: string;
  }>(
    `SELECT ou."orderId",
            COALESCE(u."email", u."username") AS "user",
            ou."body"                         AS "body",
            ou."createdAt"                    AS "createdAt"
     FROM "orderUpdates" ou
              LEFT JOIN "users" u ON u."id" = ou."authorUserId"
     WHERE ou."orderId" IN (:ids)
     ORDER BY ou."orderId", ou."createdAt" `,
    { replacements: { ids }, type: QueryTypes.SELECT }
  );

  const updatesByOrder = new Map<number, Array<{ user: string; timestamp: string; message: string }>>();
  for (const r of updateRows) {
    const arr = updatesByOrder.get(r.orderId) ?? [];
    arr.push({
      user: (r.user ?? 'System').toString(),
      timestamp: new Date(r.createdAt).toISOString(),
      message: (r.body ?? '').toString(), // new schema: use body
    });
    updatesByOrder.set(r.orderId, arr);
  }

  const payload = orders.map(o => {
    const lastReadAt = lastByOrder.get(o.id) ?? null;
    const latestUpdateAt = latestMap.get(o.id) ?? null;
    const unreadCount = countMap.get(o.id) ?? 0;
    const updated = (o.updatedAt ?? o.createdAt);

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

  const ids = orders.map(o => o.id);
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
