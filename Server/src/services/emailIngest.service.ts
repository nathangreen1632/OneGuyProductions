import { OrderUpdate } from '../models/index.js';

export async function ingestEmailReply({
                                         orderId,
                                         fromUserId,
                                         textBody,
                                       }: { orderId: number; fromUserId: number; textBody: string; }) {
  return OrderUpdate.create({
    orderId,
    authorUserId: fromUserId,
    body: textBody,
    source: 'email',
    eventType: 'email',
    requiresCustomerResponse: false,
  });
}
