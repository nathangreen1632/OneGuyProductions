import { Transaction } from 'sequelize';
import { Order, OrderUpdate } from '../models/index.js';
import type { OrderStatus } from '../types/api.types.js';

export async function setStatus(orderId: number, status: OrderStatus, trx?: Transaction) {
  const order = await Order.findByPk(orderId, { transaction: trx });
  if (!order) throw new Error('NOT_FOUND');
  await order.update({ status }, { transaction: trx });
  await OrderUpdate.create({
    orderId: order.id,
    authorUserId: null,
    body: `Status changed to ${status}`,
    source: 'system',
    eventType: 'status',
    requiresCustomerResponse: false,
  }, { transaction: trx });
}

export async function assignToAdmin(orderId: number, adminUserId: number, trx?: Transaction) {
  const order = await Order.findByPk(orderId, { transaction: trx });
  if (!order) throw new Error('NOT_FOUND');
  await order.update({ assignedAdminId: adminUserId }, { transaction: trx });
  await OrderUpdate.create({
    orderId: order.id,
    authorUserId: null,
    body: `Assigned to admin #${adminUserId}`,
    source: 'system',
    eventType: 'status',
    requiresCustomerResponse: false,
  }, { transaction: trx });
}
