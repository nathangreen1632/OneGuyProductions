import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOrderStore } from '../store/useOrderStore';
import { isWithin72Hours } from '../helpers/dateHelper';
import type { Order, OrderStatus, OrderState } from '../types/order.types';
import OrderEditModalView from '../jsx/orderEditModalView';
import OrderCardView from '../jsx/orderCardView';

function getStatusTextClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'complete': return 'text-emerald-600';
    case 'cancelled': return 'text-red-600';
    case 'in-progress': return 'text-yellow-500';
    case 'needs-feedback': return 'text-orange-600';
    case 'pending': return 'text-sky-600';
    default: return 'text-gray-600';
  }
}

type ApiError = {
  error?: string;
  message?: string;
  details?: string | string[] | Record<string, string>;
  code?: string | number;
};

async function extractApiErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiError;
    const e = (data ?? {});

    let detailText: string = '';

    if (Array.isArray(e.details)) {
      detailText = e.details.join(', ');
    } else if (typeof e.details === 'string') {
      detailText = e.details;
    }


    const core = e.error || e.message || '';
    const combined = [core, detailText].filter(Boolean).join(' — ').trim();

    if (combined) return combined;
  } catch {

  }

  try {
    const text = await res.text();
    if (text && text.trim().length > 0) return text.trim();
  } catch {

  }

  switch (res.status) {
    case 400: return 'Your request was invalid. Please check the fields and try again.';
    case 401: return 'You are not signed in. Please log in and try again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'We could not find that order.';
    case 409: return 'There was a conflict saving your changes. Please refresh and try again.';
    case 422: return 'Some fields failed validation. Please review and try again.';
    case 423: return 'This order is locked — the 72-hour edit window has expired.';
    case 429: return 'Too many requests. Please wait a moment and try again.';
    case 500: return 'The server encountered an error. Please try again shortly.';
    case 503: return 'Service is temporarily unavailable. Please try again shortly.';
    default: return `Request failed (HTTP ${res.status}).`;
  }
}

function refineMessageForEditWindow(msg: string, status: number): string {
  const normalized = msg.toLowerCase();
  const looksLocked =
    status === 423 ||
    normalized.includes('locked') ||
    normalized.includes('edit window') ||
    normalized.includes('72') && normalized.includes('hour');

  if (looksLocked) {
    return 'This order is locked — the 72-hour edit window has expired. You can still message in the thread, but edits to the order details are disabled.';
  }
  return msg;
}

export default function OrderCardLogic(): React.ReactElement {
  const orders: Order[] = useOrderStore((s: OrderState): Order[] => s.orders) ?? ([] as Order[]);
  const unreadOrderIds: number[] = useOrderStore((s: OrderState): number[] => s.unreadOrderIds) ?? ([] as number[]);
  const markAsRead: (id: number) => void = useOrderStore((s: OrderState): (id: number) => void => s.markAsRead);
  const updateOrder: (order: Order) => void = useOrderStore((s: OrderState): (order: Order) => void => s.updateOrder);

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleCardClick: (order: Order) => void = (order: Order): void => {
    if (unreadOrderIds.includes(order.id)) {
      markAsRead(order.id);
    }
  };

  const handleEdit: (order: Order) => void = (order: Order): void => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  };

  const handleSave: (updatedOrder: Partial<Order>) => Promise<void> = async (
    updatedOrder: Partial<Order>
  ): Promise<void> => {

    if (updatedOrder.id == null) {
      toast.error('Cannot update this order: missing order ID.');
      return;
    }

    try {
      const res: Response = await fetch(`/api/order/${updatedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedOrder),
      });

      if (!res.ok) {
        const rawMsg = await extractApiErrorMessage(res);
        const msg = refineMessageForEditWindow(rawMsg, res.status);
        toast.error(msg || 'Update failed.');
        return;
      }

      const savedOrder: Order = (await res.json()) as Order;
      updateOrder(savedOrder);
      setSelectedOrder(savedOrder);
      toast.success('Order updated.');
      setEditModalOpen(false);
    } catch (err: unknown) {
      console.error('Error saving order:', err);
      toast.error('Network error — please check your connection and try again.');
    }
  };

  const handleCancel: (order: Order) => Promise<void> = async (
    order: Order
  ): Promise<void> => {
    try {
      const res: Response = await fetch(`/api/order/${order.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        const msg = await extractApiErrorMessage(res);
        toast.error(msg || 'Failed to cancel order.');
        return;
      }

      const updatedOrders: Order[] = orders.map(
        (o: Order): Order =>
          o.id === order.id ? { ...o, status: 'cancelled' as OrderStatus } : o
      );
      useOrderStore.setState({ orders: updatedOrders });

      toast.success('Order canceled.');
    } catch (err: unknown) {
      console.error('Error canceling order:', err);
      toast.error('Network error while canceling order. Please try again.');
    }
  };

  const handleDownload: (orderId: number) => void = (orderId: number): void => {
    console.log('Downloading invoice for:', orderId);
  };

  return (
    <>
      <OrderCardView
        orders={orders}
        unreadOrderIds={unreadOrderIds}
        onCardClick={handleCardClick}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onDownload={handleDownload}
        getStatusTextClasses={getStatusTextClasses}
        isWithin72Hours={isWithin72Hours}
      />

      {editModalOpen && selectedOrder && (
        <OrderEditModalView
          order={selectedOrder}
          onClose={(): void => setEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
