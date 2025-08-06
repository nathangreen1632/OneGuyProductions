import type { Request, Response } from 'express';
import { handleNewOrder } from '../services/order.service.js';
import { HandleOrderResult } from '../types/FormRequestBodies.js';
import { Order, OrderUpdate, User } from '../models/index.js';
import { isWithin72Hours } from '../utils/time.js';
import { generatePdfBuffer } from '../services/pdf.service.js';

// ─────────────────────────────────────────────────────────────
// 📨 Submit Order (Production-Used)
// ─────────────────────────────────────────────────────────────
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

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ No user found for email: ${email}`);
      res.status(401).json({ error: 'Unauthorized. User not found for this email.' });
      return;
    }

    const customerId = user.id; // ✅ safely set from DB

    const result: HandleOrderResult = await handleNewOrder({
      name,
      email,
      businessName,
      projectType,
      budget,
      timeline,
      description,
      customerId,
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
  } catch (err) {
    console.error('🧨 Unexpected error during order submission:', err);
    res.status(500).json({ error: 'Server error while submitting order.' });
  }
}

// ─────────────────────────────────────────────────────────────
// 📦 Get Orders for Logged-In Customer
// ─────────────────────────────────────────────────────────────
export async function getUserOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const orders = await Order.findAll({
      where: { customerId: userId },
      include: [{ model: OrderUpdate, as: 'updates' }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(orders); // ✅ Fixed: return raw array
  } catch (err) {
    console.error('Fetch Orders Error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
}

// ─────────────────────────────────────────────────────────────
// ❌ Cancel Order (within 72 hours)
// ─────────────────────────────────────────────────────────────
export async function cancelOrder(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const orderId = parseInt(req.params.id, 10);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const order = await Order.findOne({ where: { id: orderId, customerId: userId } });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (!order.createdAt || !isWithin72Hours(order.createdAt.toISOString())) {
      res.status(403).json({ error: 'Order can no longer be cancelled.' });
      return;
    }


    await order.update({ status: 'cancelled' });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Cancel Order Error:', err);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
}

// ─────────────────────────────────────────────────────────────
// 🧾 Download PDF Invoice for Order
// ─────────────────────────────────────────────────────────────
export async function downloadInvoice(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const orderId = parseInt(req.params.id, 10);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const order = await Order.findOne({ where: { id: orderId, customerId: userId } });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const pdfBuffer = await generatePdfBuffer(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Invoice Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate invoice.' });
  }
}
