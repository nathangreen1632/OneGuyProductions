import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOrderStore } from '../store/useOrderStore';
import { isWithin72Hours } from '../helpers/dateHelper';
import type { Order, OrderStatus } from '../types/order.types';
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

// ✅ renamed to reflect purpose; this is the component your route should render
export default function OrderCardLogic(): React.ReactElement {
  // Always provide arrays so the view never crashes during hydration
  const orders = useOrderStore((s) => s.orders) ?? [];
  const unreadOrderIds = useOrderStore((s) => s.unreadOrderIds) ?? [];
  const markAsRead = useOrderStore((s) => s.markAsRead);
  const updateOrder = useOrderStore((s) => s.updateOrder);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleCardClick = (order: Order): void => {
    if (unreadOrderIds.includes(order.id)) {
      markAsRead(order.id);
    }
  };

  const handleEdit = (order: Order): void => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  };

  const handleSave = async (updatedOrder: Partial<Order>): Promise<void> => {
    try {
      const res = await fetch(`/api/order/${updatedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedOrder),
      });

      if (!res.ok) {
        toast.error('Update failed.');
        return;
      }

      const savedOrder: Order = await res.json();
      updateOrder(savedOrder);
      setSelectedOrder(savedOrder);
      toast.success('Order updated.');
      setEditModalOpen(false);
    } catch (err) {
      console.error('Error saving order:', err);
      toast.error('Server error.');
    }
  };

  const handleCancel = async (order: Order): Promise<void> => {
    try {
      const res = await fetch(`/api/order/${order.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        toast.error('Failed to cancel order.');
        return;
      }

      const updatedOrders = orders.map((o) =>
        o.id === order.id ? { ...o, status: 'cancelled' as OrderStatus } : o
      );
      useOrderStore.setState({ orders: updatedOrders });

      toast.success('Order canceled.');
    } catch (err) {
      console.error('Error canceling order:', err);
      toast.error('Server error while canceling order.');
    }
  };

  const handleDownload = (orderId: number): void => {
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
          onClose={() => setEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
