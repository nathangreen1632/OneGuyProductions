// Server/src/services/orderUpdate.service.ts
import { Transaction, UniqueConstraintError, ValidationError } from 'sequelize';
import { Order, OrderUpdate } from '../models/index.js';

export interface CreateCommentUpdateResult {
  ok: boolean;
  code?:
    | 'NOT_FOUND'
    | 'ORDER_CLOSED'
    | 'RATE_LIMIT'
    | 'VALIDATION_ERROR'
    | 'FK_VIOLATION'
    | 'DB_ERROR';
  message?: string;
  update?: OrderUpdate;
}

export async function createCommentUpdate(
  orderId: number,
  authorUserId: number,
  body: string,
  requiresCustomerResponse = false,
  trx?: Transaction
): Promise<CreateCommentUpdateResult> {
  const order = await Order.findByPk(orderId, { transaction: trx });

  if (!order) {
    return { ok: false, code: 'NOT_FOUND', message: 'Order not found.' };
  }

  if (order.status === 'complete' || order.status === 'cancelled') {
    return {
      ok: false,
      code: 'ORDER_CLOSED',
      message: `Order is ${order.status}; updates are not allowed.`,
    };
  }

  try {
    const created = await OrderUpdate.create(
      {
        orderId,
        authorUserId,
        body,
        source: 'web',
        eventType: 'comment',
        requiresCustomerResponse,
      },
      { transaction: trx }
    );
    return { ok: true, update: created };
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      const constraint: string | undefined =
        (err as any)?.parent?.constraint ?? err.message;

      if (
        constraint?.includes('idx_orderupdates_rate_limit_sec') ||
        constraint?.includes('idx_orderupdates_rate_limit')
      ) {
        return {
          ok: false,
          code: 'RATE_LIMIT',
          message: 'You just posted an update. Try again in a second.',
        };
      }

      return {
        ok: false,
        code: 'DB_ERROR',
        message: 'Update failed due to a uniqueness constraint.',
      };
    }

    if (err instanceof ValidationError) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: err.errors?.[0]?.message || 'Validation failed.',
      };
    }

    const pgCode: string | undefined = (err as any)?.parent?.code;
    if (pgCode === '23503') {
      return {
        ok: false,
        code: 'FK_VIOLATION',
        message: 'Related record not found for order or user.',
      };
    }

    const safeMessage: string =
      (err as any)?.message || 'Unknown database error creating update.';

    console.error('❌ [createCommentUpdate] DB error:', {
      error: safeMessage,
      orderId,
      authorUserId,
    });

    return { ok: false, code: 'DB_ERROR', message: 'Could not add update.' };
  }
}
