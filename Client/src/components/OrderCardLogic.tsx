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
    try {
      const res: Response = await fetch(`/api/order/${updatedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedOrder),
      });

      if (!res.ok) {
        toast.error('Update failed.');
        return;
      }

      const savedOrder: Order = (await res.json()) as Order;
      updateOrder(savedOrder);
      setSelectedOrder(savedOrder);
      toast.success('Order updated.');
      setEditModalOpen(false);
    } catch (err: unknown) {
      console.error('Error saving order:', err);
      toast.error('Server error.');
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
        toast.error('Failed to cancel order.');
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
      toast.error('Server error while canceling order.');
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
