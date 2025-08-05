import { OrderModel, OrderCreationAttributes } from '../models/order.model.js';
import { sendOrderEmail } from './resend.service.js';

interface OrderHandlingResult {
  dbSuccess: boolean;
  emailSuccess: boolean;
}

export async function handleNewOrder(data: OrderCreationAttributes): Promise<OrderHandlingResult> {

  let dbSuccess: boolean = false;
  let emailSuccess: boolean = false;

  try {
    await OrderModel.create(data);
    dbSuccess = true;
  } catch (err: unknown) {
    const dbErrorMessage: string =
      err instanceof Error ? err.message : 'Unknown database error';
    console.error('❌ [handleNewOrder] DB save failed:', {
      error: dbErrorMessage,
      payload: data,
    });
  }

  try {
    await sendOrderEmail(data);
    emailSuccess = true;
  } catch (err: unknown) {
    const emailErrorMessage: string =
      err instanceof Error ? err.message : 'Unknown email error';
    console.error('❌ [handleNewOrder] Email send failed:', {
      error: emailErrorMessage,
      payload: {
        name: data.name,
        email: data.email,
        projectType: data.projectType,
      },
    });
  }

  return { dbSuccess, emailSuccess };
}
