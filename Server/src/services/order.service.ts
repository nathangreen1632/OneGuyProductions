import { OrderModel, OrderCreationAttributes } from '../models/order.model.js';
import { sendOrderEmail } from './resend.service.js';
import type { OrderHandlingResult } from '../types/order.types.js';

export async function handleNewOrder(data: OrderCreationAttributes): Promise<OrderHandlingResult> {
  let dbSuccess = false;
  let emailSuccess = false;
  let orderId: number | undefined;

  try {
    const created = await OrderModel.create(data);
    dbSuccess = true;
    orderId = created.id; // ✅ capture id
  } catch (err: unknown) {
    const dbErrorMessage = err instanceof Error ? err.message : 'Unknown database error';
    console.error('❌ [handleNewOrder] DB save failed:', { error: dbErrorMessage, payload: data });
  }

  try {
    await sendOrderEmail(data);
    emailSuccess = true;
  } catch (err: unknown) {
    const emailErrorMessage = err instanceof Error ? err.message : 'Unknown email error';
    console.error('❌ [handleNewOrder] Email send failed:', {
      error: emailErrorMessage,
      payload: { name: data.name, email: data.email, projectType: data.projectType },
    });
  }

  return { dbSuccess, emailSuccess, orderId }; // ✅ include orderId
}
