import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type {Order, OrderUpdateEntry} from '../types/order.types';
import { useOrderStore } from '../store/useOrder.store';
import { useThreadModalStore } from '../store/useThreadModal.store';
import ThreadReplyModalView from '../jsx/modalView/threadReplyModalView';

type ThreadMessage = { id: string; user: string; timestamp: string; message: string };

function statusClass(status: string): string {
  try {
    switch (String(status ?? '').toLowerCase()) {
      case 'complete':       return 'text-emerald-500';
      case 'cancelled':      return 'text-red-500';
      case 'in-progress':    return 'text-yellow-500';
      case 'needs-feedback': return 'text-orange-500';
      case 'pending':        return 'text-sky-500';
      default:
        if (status) console.warn('ThreadReplyModal: unknown status', status);
        return 'text-gray-500';
    }
  } catch (err) {
    console.error('ThreadReplyModal: statusClass failed', err);
    return 'text-gray-500';
  }
}

function safeFormat(dateLike: unknown, fmt: string): string {
  try {
    const d = new Date(String(dateLike));
    return Number.isNaN(d.getTime()) ? '' : format(d, fmt);
  } catch (err) {
    console.error('ThreadReplyModal: date format failed', err);
    return '';
  }
}

export default function ThreadReplyModalLogic(): React.ReactElement | null {
  const modal = useThreadModalStore();
  const isOpen: boolean = Boolean(modal?.isOpen);
  const orderId: number | undefined = (modal?.orderId as number | undefined);
  const close = (typeof modal?.close === 'function' ? modal.close : undefined) as
    | (() => void)
    | undefined;

  const orderStore = useOrderStore() as {
    orders?: Order[];
    postOrderComment?: (orderId: number, body: string, requiresCustomerResponse?: boolean) => Promise<boolean>;
  };
  const orders: Order[] = Array.isArray(orderStore?.orders) ? orderStore.orders : [];
  const postOrderComment =
    (typeof orderStore?.postOrderComment === 'function' ? orderStore.postOrderComment : undefined) as
      | ((orderId: number, body: string, requiresCustomerResponse?: boolean) => Promise<boolean>)
      | undefined;

  const order: Order | undefined = useMemo((): Order | undefined => {
    try {
      if (!isOpen || !Number.isFinite(orderId)) return undefined;
      return orders.find((o) => Number.isFinite(o?.id) && o.id === orderId);
    } catch (err) {
      console.error('ThreadReplyModal: failed to select order', err);
      return undefined;
    }
  }, [isOpen]);

  const messages: ThreadMessage[] = useMemo((): ThreadMessage[] => {
    try {
      if (!order || !Array.isArray(order.updates)) return [];
      return order.updates.map((u: OrderUpdateEntry, idx: number): ThreadMessage => {
        const uUser: string = String((u as any)?.user ?? 'User');
        const uTime: string = String((u as any)?.timestamp ?? '');
        const uMsg: string = String((u as any)?.message ?? '');
        const id = `${uUser}-${uTime}-${idx}`;
        return { id, user: uUser, timestamp: uTime, message: uMsg };
      });
    } catch (err) {
      console.error('ThreadReplyModal: failed to build messages', err);
      return [];
    }
  }, [order]);

  const [reply, setReply] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function handleSend(): Promise<void> {
    try {
      if (!order || !Number.isFinite(order.id)) {
        console.warn('ThreadReplyModal: cannot send — no order selected');
        toast.error('No order selected for reply.');
        return;
      }
      const body: string = reply.trim();
      if (!body) {
        toast.error('Please enter a message.');
        return;
      }
      if (submitting) {
        toast.error('Please wait… still sending.');
        return;
      }
      if (typeof postOrderComment !== 'function') {
        console.error('ThreadReplyModal: postOrderComment is unavailable');
        toast.error('Unable to send your message right now.');
        return;
      }

      setSubmitting(true);
      let ok: boolean = false;
      try {
        ok = Boolean(await postOrderComment(order.id, body, false));
      } catch (err) {
        console.error('ThreadReplyModal: postOrderComment threw', err);
        toast.error('Failed to send your message.');
        ok = false;
      } finally {
        setSubmitting(false);
      }

      if (!ok) {
        console.warn('ThreadReplyModal: postOrderComment returned falsy');
        toast.error('Message was not sent. Please try again.');
        return;
      }

      setReply('');
      if (typeof close === 'function') {
        try {
          close();
        } catch (err) {
          console.warn('ThreadReplyModal: close() failed after send', err);
        }
      }
      toast.success('Message sent.');
    } catch (err) {
      console.error('ThreadReplyModal: unexpected error in handleSend', err);
      toast.error('Unexpected error while sending.');
      setSubmitting(false);
    }
  }

  if (!isOpen || !order) return null;

  return (
    <ThreadReplyModalView
      isOpen={isOpen}
      onClose={(): void => {
        try {
          if (typeof close === 'function') close();
        } catch (err) {
          console.error('ThreadReplyModal: close handler failed', err);
          toast.error('Unable to close the modal.');
        }
      }}
      header={{
        projectType: String(order.projectType ?? ''),
        customerName: String(order.name ?? ''),
        businessName: String(order.businessName ?? ''),
        statusLabel: String(order.status ?? ''),
        statusClass: statusClass(String(order.status ?? '')),
        placedAt: safeFormat(order.createdAt, 'PPP p'),
        orderId: Number(order.id ?? 0),
      }}
      messages={messages}
      reply={reply}
      onChangeReply={(v: string): void => {
        try {
          setReply(String(v ?? ''));
        } catch (err) {
          console.error('ThreadReplyModal: onChangeReply failed', err);
          toast.error('Could not update your message.');
        }
      }}
      onSend={handleSend}
      sending={submitting}
    />
  );
}
