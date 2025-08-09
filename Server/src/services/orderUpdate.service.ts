import {Transaction} from 'sequelize';
import {Order, OrderUpdate} from '../models/index.js';

export async function createCommentUpdate(
  orderId: number,
  authorUserId: number,
  body: string,
  requiresCustomerResponse = false,
  trx?: Transaction
): Promise<OrderUpdate> {
  // Ensure order exists & is open
  const order = await Order.findByPk(orderId, { transaction: trx });
  if (!order) throw new Error('NOT_FOUND');
  if (order.status === 'complete' || order.status === 'cancelled') throw new Error('ORDER_CLOSED');

  try {
    return await OrderUpdate.create(
      {
        orderId,
        authorUserId,
        body,
        source: 'web',
        eventType: 'comment',
        requiresCustomerResponse: requiresCustomerResponse,
      },
      {transaction: trx}
    );
  } catch (err: any) {
    // Postgres unique index for per‑minute rate limit will throw here
    // idx_orderUpdates_rate_limit
    if (String(err?.message || '').includes('idx_orderUpdates_rate_limit')) {
      throw new Error('RATE_LIMIT');
    }
    throw err;
  }
}
