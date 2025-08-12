import { OrderReadReceipt } from '../models/index.js';

export async function markOneRead(userId: number, orderId: number): Promise<Date> {
  const [rec, created] = await OrderReadReceipt.findOrCreate({
    where: { orderId, userId },
    defaults: { orderId, userId, lastReadAt: new Date() },
  });

  if (!created) {
    rec.lastReadAt = new Date();
    await rec.save();
  }
  return rec.lastReadAt;
}

export async function markAllRead(userId: number): Promise<void> {
  await OrderReadReceipt.update(
    { lastReadAt: new Date() },
    { where: { userId } }
  );
}
