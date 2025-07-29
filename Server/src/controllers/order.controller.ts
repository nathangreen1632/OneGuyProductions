import { Request, Response } from 'express';
import { handleNewOrder } from '../services/Order.service.js';

export async function submitOrder(req: Request, res: Response): Promise<void> {
  try {
    await handleNewOrder(req.body);
    res.status(200).json({ message: 'Order submitted successfully' });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
}
