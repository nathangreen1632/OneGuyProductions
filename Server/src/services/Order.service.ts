import { OrderModel } from '../models/Order.model.js';
import { sendOrderEmail } from './Resend.service.js';

export async function handleNewOrder(data: {
  name: string;
  email: string;
  businessName?: string;
  projectType: string;
  budget: string;
  timeline?: string;
  description: string;
}) {
  await OrderModel.create(data);
  await sendOrderEmail(data);
}
