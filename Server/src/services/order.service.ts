import { OrderModel, OrderCreationAttributes } from '../models/order.model.js';
import { sendOrderEmail } from './resend.service.js';

export async function handleNewOrder(data: OrderCreationAttributes): Promise<void> {
  console.log('📦 Handling new order:', {
    name: data.name,
    email: data.email,
    projectType: data.projectType,
    budget: data.budget,
    businessName: data.businessName ?? 'N/A',
    timeline: data.timeline ?? 'N/A',
  });

  try {
    await OrderModel.create(data);
    console.log('✅ Order saved to database.');
  } catch (err) {
    console.error('❌ Failed to save order to database:', err);
    throw new Error('Database error while saving order.');
  }

  try {
    await sendOrderEmail(data);
    console.log('✉️ Order confirmation email sent.');
  } catch (err) {
    console.error('❌ Failed to send order email:', err);
    throw new Error('Email service failed for order notification.');
  }
}
