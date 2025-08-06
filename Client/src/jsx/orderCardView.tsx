import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOrderStore } from '../store/useOrderStore';
import { isWithin72Hours } from '../utils/dateHelpers';
import NotificationBadge from '../components/NotificationBadge';
import OrderEditModal from './orderEditModal';
import type { Order, OrderStatus } from '../types/order';

export default function OrderCardView(): React.ReactElement {
  const orders = useOrderStore((state) => state.orders);
  const unreadOrderIds = useOrderStore((state) => state.unreadOrderIds);
  const markAsRead = useOrderStore((state) => state.markAsRead);
  const updateOrder = useOrderStore((state) => state.updateOrder);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [canceledOrderIds, setCanceledOrderIds] = useState<number[]>([]);

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
      console.log('📤 PATCH payload:', updatedOrder);

      const res = await fetch(`/api/order/${updatedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedOrder),
      });

      if (!res.ok) {
        toast.error('Update failed.');
        console.error('❌ PATCH response:', res.status, await res.text());
        return;
      }

      const savedOrder: Order = await res.json();
      console.log('✅ PATCH success, received updated order:', savedOrder);

      // Before update
      const currentOrdersBefore = useOrderStore.getState().orders;
      console.log('🔁 Zustand orders BEFORE update:', currentOrdersBefore);

      updateOrder(savedOrder);

      // After update
      const currentOrdersAfter = useOrderStore.getState().orders;
      console.log('🔁 Zustand orders AFTER update:', currentOrdersAfter);

      const found = currentOrdersAfter.find((o) => o.id === savedOrder.id);
      if (found) {
        console.log('✅ Order update confirmed in state:', found);
      } else {
        console.warn('⚠️ Updated order NOT found in state after update!');
      }

      setSelectedOrder(savedOrder);
      toast.success('Order updated.');
      setEditModalOpen(false);
    } catch (err) {
      console.error('❌ Error in handleSave():', err);
      toast.error('Server error.');
    }
  };


  const handleCancel = async (order: Order): Promise<void> => {
    try {
      // Optimistically mark as canceled
      setCanceledOrderIds((prev) => [...prev, order.id]);

      const res = await fetch(`/api/order/${order.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        toast.error('Failed to cancel order.');
        console.error('❌ Cancel order failed:', await res.text());
        return;
      }

      // ✅ Update local order status
      const updatedOrders = orders.map((o) =>
        o.id === order.id ? { ...o, status: 'cancelled' as OrderStatus } : o
      );
      useOrderStore.setState({ orders: updatedOrders });

      toast.success('Order canceled.');
    } catch (err) {
      console.error('❌ Cancel error:', err);
      toast.error('Server error while canceling order.');
    }
  };


  const handleDownload = (orderId: number): void => {
    console.log('Downloading invoice for:', orderId);
  };

  // ✅ Defensive check added
  if (!Array.isArray(orders)) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No orders found or failed to load orders.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {orders.map((order) => {
          const isEditable = isWithin72Hours(order.createdAt);
          const isUnread = unreadOrderIds.includes(order.id);

          return (
            <div
              key={order.id}
              className="relative rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] p-4 sm:p-6 shadow-[0_4px_14px_0_var(--theme-shadow)] border border-[var(--theme-border)] transition cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
              role="group"
              aria-label={`Order card for ${order.name}`}
              tabIndex={0}
              onClick={() => handleCardClick(order)}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(order);
                }
              }}
            >
              {isUnread && <NotificationBadge />}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-lg text-[var(--theme-text)] underline">Name</p>
                  <p className="font-semibold">{order.name}</p>
                </div>
                <div>
                  <p className="text-lg text-[var(--theme-text)] underline">Email</p>
                  <p className="font-semibold">{order.email}</p>
                </div>
                <div>
                  <p className="text-lg text-[var(--theme-text)] underline">Business</p>
                  <p className="font-semibold">{order.businessName}</p>
                </div>
                <div>
                  <p className="text-lg text-[var(--theme-text)] underline">Project Type</p>
                  <p className="font-semibold">{order.projectType}</p>
                </div>
                <div>
                  <p className="text-lg text-[var(--theme-text)] underline">Budget</p>
                  <p className="font-semibold">{order.budget}</p>
                </div>
                <div>
                  <p className="text-lg text-[var(--theme-text)] underline">Timeline</p>
                  <p className="font-semibold">{order.timeline}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-lg text-[var(--theme-text)] underline">Description</p>
                  <p className="font-medium">{order.description}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-lg text-[var(--theme-text)] underline">Status</p>
                  <p
                    className={`font-bold capitalize ${
                      order.status === 'cancelled'
                        ? 'text-red-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
              </div>

              <div
                className="mt-6 flex flex-wrap gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleEdit(order)}
                  className="px-4 py-2 bg-[var(--theme-button)] text-[var(--theme-text-white)] text-sm rounded shadow-md hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                >
                  Edit
                </button>

                {isEditable && (
                  <button
                    onClick={() => handleCancel(order)}
                    disabled={canceledOrderIds.includes(order.id)}
                    className={`px-4 py-2 text-sm rounded shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 ${
                      canceledOrderIds.includes(order.id)
                        ? 'bg-gray-500 cursor-not-allowed text-white'
                        : 'bg-[var(--theme-border-red)] hover:bg-red-700 text-[var(--theme-text-white)]'
                    }`}
                  >
                    {canceledOrderIds.includes(order.id) ? 'Cancelled' : 'Cancel'}
                  </button>
                )}

                <button
                  onClick={() => handleDownload(order.id)}
                  className="px-4 py-2 bg-[var(--theme-card)] text-[var(--theme-text-white)] text-sm rounded shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                >
                  Download Invoice
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editModalOpen && selectedOrder && (
        <OrderEditModal
          order={selectedOrder}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
