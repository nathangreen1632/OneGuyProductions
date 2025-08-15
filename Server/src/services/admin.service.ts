import { Transaction } from 'sequelize';
import { Order, OrderUpdate, sequelize } from '../models/index.js';
import type { OrderStatus } from '../types/api.types.js';

export async function setStatus(
  orderId: number,
  status: OrderStatus,
  actorUserId?: number | null,
  trx?: Transaction
): Promise<{ ok: boolean; message?: string }> {
  const ownTx: boolean = !trx;
  const t = trx ?? (await sequelize.transaction());
  try {
    const [count] = await Order.update({ status }, { where: { id: orderId }, transaction: t });
    if (count !== 1) {
      if (ownTx) {
        await t.rollback();
      }
      return { ok: false, message: 'Order not found' };
    }

    await OrderUpdate.create(
      {
        orderId,
        authorUserId: actorUserId ?? null,
        body: `Status changed to ${status}`,
        source: 'system',
        eventType: 'status',
        requiresCustomerResponse: false,
      },
      { transaction: t }
    );

    if (ownTx) {
      await t.commit();
    }
    return { ok: true };
  } catch {
    if (ownTx) {
      await t.rollback();
    }
    return { ok: false, message: 'Failed to update status' };
  }
}

export async function assignToAdmin(
  orderId: number,
  adminUserId: number,
  actorUserId?: number | null,
  trx?: Transaction
): Promise<{ ok: boolean; message?: string }> {
  const ownTx: boolean = !trx;
  const t = trx ?? (await sequelize.transaction());
  try {
    const [count] = await Order.update(
      { assignedAdminId: adminUserId },
      { where: { id: orderId }, transaction: t }
    );
    if (count !== 1) {
      if (ownTx) {
        await t.rollback();
      }
      return { ok: false, message: 'Order not found' };
    }

    await OrderUpdate.create(
      {
        orderId,
        authorUserId: actorUserId ?? null,
        body: `Assigned to admin #${adminUserId}`,
        source: 'system',
        eventType: 'status',
        requiresCustomerResponse: false,
      },
      { transaction: t }
    );

    if (ownTx) {
      await t.commit();
    }
    return { ok: true };
  } catch {
    if (ownTx) {
      await t.rollback();
    }
    return { ok: false, message: 'Failed to assign order' };
  }
}

