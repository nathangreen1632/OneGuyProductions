import { Request, Response } from 'express';
import { handleNewOrder } from '../services/order.service.js';

export async function submitOrder(req: Request, res: Response): Promise<void> {
  console.log('📝 Order route hit');

  const {
    name,
    email,
    businessName,
    projectType,
    budget,
    timeline,
    description,
  } = req.body;

  if (!name || !email || !projectType || !budget || !description) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    await handleNewOrder({
      name,
      email,
      businessName,
      projectType,
      budget,
      timeline,
      description,
    });

    res.status(200).json({ success: true, message: 'Order submitted successfully' });
  } catch (error) {
    console.error('❌ Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
}
