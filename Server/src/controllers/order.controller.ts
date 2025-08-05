import { Request, Response } from 'express';
import { handleNewOrder } from '../services/order.service.js';
import {HandleOrderResult} from "../types/FormRequestBodies.js";

export async function submitOrder(req: Request, res: Response): Promise<void> {

  const {
    name,
    email,
    businessName,
    projectType,
    budget,
    timeline,
    description,
    captchaToken,
  } = req.body;

  if (!name || !email || !projectType || !budget || !description || !captchaToken) {
    console.warn('⚠️ Missing required fields in request:', {
      name,
      email,
      projectType,
      budget,
      description,
      captchaTokenExists: !!captchaToken,
    });
    res.status(400).json({ error: 'Missing required fields or CAPTCHA token' });
    return;
  }

  const result: HandleOrderResult = await handleNewOrder({
    name,
    email,
    businessName,
    projectType,
    budget,
    timeline,
    description,
  });

  if (!result.dbSuccess) {
    console.error('❌ Order was not saved to database.');
    res.status(500).json({ error: 'Order could not be saved to the database.' });
    return;
  }

  if (!result.emailSuccess) {
    console.warn('⚠️ Order saved but email failed.');
    res.status(200).json({
      success: true,
      warning: 'Order was saved, but confirmation email failed to send.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Order submitted and confirmation sent.',
  });
}
