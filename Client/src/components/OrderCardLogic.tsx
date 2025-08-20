import React, {type RefObject, useRef, useState} from 'react';
import toast from 'react-hot-toast';
import { useOrderStore } from '../store/useOrder.store';
import { isWithin72Hours } from '../helpers/date.helper';
import type { Order, OrderStatus, OrderState } from '../types/order.types';
import OrderEditModalView from '../jsx/modalView/orderEditModalView';
import OrderCardView from '../jsx/orderCardView';

function getStatusTextClasses(status: string): string {
  try {
    const s = String(status ?? '').toLowerCase();
    switch (s) {
      case 'complete': return 'text-emerald-600';
      case 'cancelled': return 'text-red-600';
      case 'in-progress': return 'text-yellow-500';
      case 'needs-feedback': return 'text-orange-600';
      case 'pending': return 'text-sky-600';
      default:
        if (s) console.warn('OrderCard: unknown status', s);
        return 'text-gray-600';
    }
  } catch (err) {
    console.error('OrderCard: getStatusTextClasses failed', err);
    return 'text-gray-600';
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

    const e: ApiError = (data ?? {});

    let detailText: string = '';
    if (Array.isArray(e.details)) {
      detailText = e.details.join(', ');
    } else if (typeof e.details === 'string') {
      detailText = e.details;
    } else if (e.details && typeof e.details === 'object') {
      try {
        detailText = Object.values(e.details).join(', ');
      } catch (err) {
        console.error('OrderCard: failed to parse details object', err);
        detailText = JSON.stringify(e.details);
      }
    }

    const core = e.error || e.message || '';
    const combined = [core, detailText].filter(Boolean).join(' — ').trim();
    if (combined) return combined;
  } catch (err) {
    console.error('OrderCard: extractApiErrorMessage failed', err);
  }

  try {
    const text: string = await res.text();
    if (text && text.trim().length > 0) return text.trim();
  } catch (err) {
    console.error('OrderCard: extractApiErrorMessage text read failed', err);
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
  try {
    const normalized: string = (msg ?? '').toLowerCase();
    const looksLocked: boolean =
      status === 423 ||
      normalized.includes('locked') ||
      normalized.includes('edit window') ||
      (normalized.includes('72') && normalized.includes('hour'));

    if (looksLocked) {
      return 'This order is locked — the 72-hour edit window has expired. You can still message in the thread, but edits to the order details are disabled.';
    }
    return msg || 'Update failed.';
  } catch {
    return msg || 'Update failed.';
  }
}

export default function OrderCardLogic(): React.ReactElement {
  const orders: Order[] =
    useOrderStore((s: OrderState): Order[] => s.orders) ?? ([] as Order[]);
  const unreadOrderIds: number[] =
    useOrderStore((s: OrderState): number[] => s.unreadOrderIds) ?? ([] as number[]);
  const markAsRead: (id: number) => void =
    useOrderStore((s: OrderState): (id: number) => void => s.markAsRead);
  const updateOrder: (order: Order) => void =
    useOrderStore((s: OrderState): (order: Order) => void => s.updateOrder);

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const savingRef: RefObject<boolean> = useRef(false);
  const cancelingRef: RefObject<boolean> = useRef(false);
  const downloadingRef: RefObject<boolean> = useRef(false);

  const handleCardClick: (order: Order) => void = (order: Order): void => {
    try {
      if (!order || !Number.isFinite(order.id)) return;
      if (unreadOrderIds.includes(order.id)) {
        markAsRead(order.id);
      }
    } catch (err) {
      console.error('OrderCard: handleCardClick failed', err);
    }
  };

  const handleEdit: (order: Order) => void = (order: Order): void => {
    try {
      if (!order || !Number.isFinite(order.id)) {
        toast.error('Invalid order selected.');
        return;
      }
      setSelectedOrder(order);
      setEditModalOpen(true);
    } catch (err) {
      console.error('OrderCard: handleEdit failed', err);
      toast.error('Could not open the edit dialog.');
    }
  };

  const handleSave: (updatedOrder: Partial<Order>) => Promise<void> = async (
    updatedOrder: Partial<Order>
  ): Promise<void> => {
    if (savingRef.current) {
      toast.error('Please wait… still saving.');
      return;
    }

    if (updatedOrder.id == null || !Number.isFinite(updatedOrder.id)) {
      toast.error('Cannot update this order: missing or invalid order ID.');
      return;
    }

    savingRef.current = true;

    try {
      const controller = new AbortController();
      const timer: number = setTimeout((): void => controller.abort(), 20_000);

      const res: Response = await fetch(`/api/order/${updatedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedOrder),
        signal: controller.signal,
      }).catch((err: any): never => {
        console.error('OrderCard: save request failed', err);
        toast.error('Network error while saving. Please try again.');
        throw err;
      });

      clearTimeout(timer);

      if (!res.ok) {
        const rawMsg: string = await extractApiErrorMessage(res);
        const msg: string = refineMessageForEditWindow(rawMsg, res.status);
        toast.error(msg);
        return;
      }

      let savedOrder: Order | null = null;
      try {
        savedOrder = (await res.json()) as Order;
      } catch (err) {
        console.error('OrderCard: save response JSON parse failed', err);
        toast.error('Order was saved, but response was invalid.');
        return;
      }

      if (!savedOrder || !Number.isFinite(savedOrder.id)) {
        console.warn('OrderCard: server returned malformed order', savedOrder);
        toast.error('Server returned an invalid order.');
        return;
      }

      try {
        updateOrder(savedOrder);
      } catch (err) {
        console.error('OrderCard: failed to update local order state', err);
        toast.error('Updated, but failed to refresh the order locally.');
      }

      setSelectedOrder(savedOrder);
      setEditModalOpen(false);
      toast.success('Order updated.');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('OrderCard: save request timed out');
        toast.error('Save timed out. Please try again.');
      } else {
        console.error('OrderCard: error saving order', err);
        toast.error('Network error — please check your connection and try again.');
      }
    } finally {
      savingRef.current = false;
    }
  };

  const handleCancel: (order: Order) => Promise<void> = async (order: Order): Promise<void> => {
    if (cancelingRef.current) {
      toast.error('Please wait… still canceling.');
      return;
    }

    try {
      if (!order || !Number.isFinite(order.id)) {
        toast.error('Invalid order.');
        return;
      }

      cancelingRef.current = true;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);

      const res: Response = await fetch(`/api/order/${order.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      }).catch((err) => {
        throw err;
      });

      clearTimeout(timer);

      if (!res.ok) {
        const msg: string = await extractApiErrorMessage(res);
        toast.error(msg || 'Failed to cancel order.');
        return;
      }

      try {
        const updatedOrders: Order[] = orders.map(
          (o: Order): Order =>
            o.id === order.id ? { ...o, status: 'cancelled' as OrderStatus } : o
        );
        useOrderStore.setState({ orders: updatedOrders });
      } catch (err) {
        console.error('OrderCard: failed to update local state after cancel', err);
      }

      toast.success('Order canceled.');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('OrderCard: cancel request timed out');
        toast.error('Cancel timed out. Please try again.');
      } else {
        console.error('OrderCard: error canceling order', err);
        toast.error('Network error while canceling. Please try again.');
      }
    } finally {
      cancelingRef.current = false;
    }
  };

  const handleDownload: (orderId: number) => Promise<void> = async (orderId: number): Promise<void> => {
    if (downloadingRef.current) {
      toast.error('Please wait… preparing your download.');
      return;
    }

    try {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        toast.error('Invalid order id for download.');
        return;
      }

      downloadingRef.current = true;

      const controller = new AbortController();
      const timer: number = setTimeout(() => controller.abort(), 30_000);

      const res: Response = await fetch(`/api/order/${orderId}/invoice`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      }).catch((err: any): never => {
        console.error('OrderCard: download request failed', err);
        toast.error('Network error while downloading invoice. Please try again.')
        throw err;
      });

      clearTimeout(timer);

      if (!res.ok) {
        const msg: string = await extractApiErrorMessage(res);
        toast.error(msg || 'Failed to download invoice.');
        return;
      }

      let blob: Blob;
      try {
        blob = await res.blob();
      } catch (err) {
        console.error('OrderCard: failed to read invoice blob', err);
        toast.error('Invoice download failed — invalid file.');
        return;
      }

      const url: string = URL.createObjectURL(blob);
      try {
        const filename = `OneGuyProductions_Order_${orderId}.pdf`;

        const a: HTMLAnchorElement = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Invoice downloaded.');
      } catch (err) {
        console.error('OrderCard: error triggering download', err);
        toast.error('Could not start the download.');
      } finally {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.error('OrderCard: download timed out');
        toast.error('Download timed out. Please try again.');
      } else {
        console.error('OrderCard: error downloading invoice', err);
        toast.error('Network error — please check your connection and try again.');
      }
    } finally {
      downloadingRef.current = false;
    }
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
