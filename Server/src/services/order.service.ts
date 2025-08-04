import { OrderModel, OrderCreationAttributes } from '../models/order.model.js';
import { sendOrderEmail } from './resend.service.js';

export async function handleNewOrder(data: OrderCreationAttributes): Promise<{ dbSuccess: boolean; emailSuccess: boolean }> {
  console.log('📦 Handling new order submission:', {
    name: data.name,
    email: data.email,
    projectType: data.projectType,
    budget: data.budget,
    businessName: data.businessName ?? 'N/A',
    timeline: data.timeline ?? 'N/A',
  });

  let dbSuccess = false;
  let emailSuccess = false;

  // Database operation
  try {
    await OrderModel.create(data);
    dbSuccess = true;
    console.log('✅ Order saved to database successfully.');
  } catch (err) {
    console.error('❌ Error saving order to database:', {
      error: err,
      payload: data,
    });
  }

  // Email operation
  try {
    await sendOrderEmail(data);
    emailSuccess = true;
    console.log('✉️ Order confirmation email sent successfully.');
  } catch (err) {
    console.error('❌ Error sending order confirmation email:', {
      error: err,
      payload: {
        name: data.name,
        email: data.email,
        projectType: data.projectType,
      },
    });
  }

  // Final status
  console.log('📊 Order handling complete:', {
    dbSuccess,
    emailSuccess,
    result: dbSuccess && emailSuccess ? 'full success' : dbSuccess ? 'partial (email failed)' : 'partial (db failed)',
  });

  return { dbSuccess, emailSuccess };
}
