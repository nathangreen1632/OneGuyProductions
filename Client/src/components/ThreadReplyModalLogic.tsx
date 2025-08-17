import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { Order } from '../types/order.types';
import { useOrderStore } from '../store/useOrderStore';
import { useThreadModalStore } from '../store/useThreadModalStore';
import ThreadReplyModalView from '../jsx/modalView/threadReplyModalView.tsx';

type ThreadMessage = { id: string; user: string; timestamp: string; message: string; };

function statusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'complete': return 'text-emerald-500';
    case 'cancelled': return 'text-red-500';
    case 'in-progress': return 'text-yellow-500';
    case 'needs-feedback': return 'text-orange-500';
    case 'pending': return 'text-sky-500';
    default: return 'text-gray-500';
  }
}

export default function ThreadReplyModalLogic(): React.ReactElement | null {
  const { isOpen, orderId, close } = useThreadModalStore();

  const {
    orders,
    postOrderComment,
  } = useOrderStore() as {
    orders: Order[];
    postOrderComment: (orderId: number, body: string, requiresCustomerResponse?: boolean) => Promise<boolean>;
  };

  const order: Order | undefined = useMemo(
    (): Order | undefined => (isOpen && orderId ? orders.find(o => o.id === orderId) : undefined),
    [isOpen, orderId]
  );

  const messages: ThreadMessage[] = useMemo((): ThreadMessage[] => {
    if (!order) return [];
    return order.updates.map(u => ({
      id: `${u.user}-${u.timestamp}-${u.message.slice(0, 20)}`,
      user: u.user,
      timestamp: u.timestamp,
      message: u.message,
    }));
  }, [order]);

  const [reply, setReply] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function handleSend(): Promise<void> {
    if (!order || reply.trim().length === 0) return;
    setSubmitting(true);

    const ok: boolean = await postOrderComment(order.id, reply.trim(), false);

    setSubmitting(false);
    if (!ok) return;

    setReply('');
    close();
  }

  if (!isOpen || !order) return null;

  return (
    <ThreadReplyModalView
      isOpen={isOpen}
      onClose={close}
      header={{
        projectType: order.projectType,
        customerName: order.name,
        businessName: order.businessName ?? '',
        statusLabel: order.status,
        statusClass: statusClass(order.status),
        placedAt: format(new Date(order.createdAt), 'PPP p'),
        orderId: order.id,
      }}
      messages={messages}
      reply={reply}
      onChangeReply={setReply}
      onSend={handleSend}
      sending={submitting}
    />
  );
}
