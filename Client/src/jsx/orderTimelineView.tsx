import React from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { useEditOrderStore } from '../store/useEditOrderStore'; // ✅ added
import { isWithin72Hours } from '../utils/dateHelpers';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OrderTimelineView(): React.ReactElement {
  const { orders } = useOrderStore();
  const { openModal: openEditModal } = useEditOrderStore(); // ✅ extract edit modal handler

  const handleCancel = async (orderId: number): Promise<void> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Order canceled.');
        // You could also call a refetch function here if your store supports it
      } else {
        toast.error('Failed to cancel order.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {orders.map((order) => {
        const isEditable = isWithin72Hours(order.createdAt);

        return (
          <div
            key={order.id}
            className="rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] p-4 sm:p-6 shadow-[0_4px_14px_0_var(--theme-shadow)] border border-[var(--theme-border)]"
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-bold">{order.projectType}</h3>
              <p className="text-sm text-[var(--theme-border)]">
                {order.name} • {order.businessName}
              </p>
              <p className="text-sm font-medium text-emerald-600 capitalize mt-1">
                Status: {order.status}
              </p>
              <p className="text-xs text-gray-500">
                Placed: {format(new Date(order.createdAt), 'PPP p')}
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-sm text-[var(--theme-border)] mb-1">Description</p>
              <p className="text-sm font-medium">{order.description}</p>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-4 border-l-2 border-[var(--theme-border)] pl-4">
              {order.updates.map((update, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-3 top-1.5 w-3 h-3 rounded-full bg-[var(--theme-border)]" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">{update.user}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(update.timestamp), 'PPP p')}
                    </p>
                    <p className="text-sm">{update.message}</p>
                  </div>
                </div>
              ))}

              {order.updates.length === 0 && (
                <p className="text-sm text-gray-400 italic">No updates yet.</p>
              )}
            </div>

            {/* Actions */}
            {isEditable && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => openEditModal(order)}
                  className="px-4 py-2 bg-[var(--theme-button)] text-[var(--theme-text-white)] text-sm rounded shadow-md hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                >
                  Edit Order
                </button>

                <button
                  onClick={() => handleCancel(order.id)}
                  className="px-4 py-2 bg-[var(--theme-border-red)] text-[var(--theme-text-white)] text-sm rounded shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
