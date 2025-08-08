import type { Request, Response } from 'express';
import { handleNewOrder } from '../services/order.service.js';
import { HandleOrderResult } from '../types/requestBodies.types.js';
import { Order, OrderUpdate, User } from '../models/index.js';
import { isWithin72Hours } from '../utils/time.js';
import { generatePdfBuffer } from '../services/pdf.service.js';
import type { OrderStatus } from '../types/order.types.js';
import { validOrderStatuses } from '../types/order.types.js';

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
    // Try to find an existing user — but don't require one
    const user = await User.findOne({ where: { email } });
    const customerId = user?.id || null;

    if (!user) {
      console.warn(`🟡 Proceeding without linked user for email: ${email}`);
    }

    const result: HandleOrderResult = await handleNewOrder({
      name,
      email,
      businessName,
      projectType,
      budget,
      timeline,
      description,
      customerId, // ✅ null-safe
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
// ✏️ Update Order (within 72 hours)
// ─────────────────────────────────────────────────────────────
export async function updateOrder(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const orderId = parseInt(req.params.id, 10);
  const { businessName, projectType, budget, timeline, description } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (isNaN(orderId)) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  try {
    const order = await Order.findOne({ where: { id: orderId, customerId: userId } });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (!isWithin72Hours(order.createdAt.toISOString())) {
      res.status(403).json({ error: 'Order can no longer be edited.' });
      return;
    }

    await order.update({
      businessName,
      projectType,
      budget,
      timeline,
      description,
    });

    res.status(200).json({ success: true, message: 'Order updated.', orderId });
  } catch (err) {
    console.error('❌ Update Order Error:', err);
    res.status(500).json({ error: 'Failed to update order.' });
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

  if (isNaN(orderId)) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  try {
    const order = await Order.findOne({
      where: { id: orderId, customerId: userId },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (!order.createdAt || !isWithin72Hours(order.createdAt.toISOString())) {
      res.status(403).json({ error: 'Order can no longer be cancelled.' });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(409).json({ error: 'Order already cancelled.' });
      return;
    }

    const nextStatus: OrderStatus = 'cancelled';

    if (!validOrderStatuses.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }

    await order.update({ status: nextStatus });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      orderId,
      status: 'cancelled',
    });
  } catch (err) {
    console.error('❌ Cancel Order Error:', err);
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
