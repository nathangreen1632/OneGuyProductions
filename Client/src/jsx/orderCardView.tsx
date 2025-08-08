import React from 'react';
import NotificationBadge from '../common/NotificationBadge.tsx';
import type { Order } from '../types/order';

interface Props {
  orders: Order[];
  unreadOrderIds: number[];
  onCardClick: (order: Order) => void;
  onEdit: (order: Order) => void;
  onCancel: (order: Order) => void;
  onDownload: (orderId: number) => void;
  getStatusTextClasses: (status: string) => string;
  isWithin72Hours: (createdAt: string | Date) => boolean;
}

export default function OrderCardView({
                                            // defensive defaults so .map/.includes never crash during store hydration
                                            orders = [],
                                            unreadOrderIds = [],
                                            onCardClick,
                                            onEdit,
                                            onCancel,
                                            onDownload,
                                            getStatusTextClasses,
                                            isWithin72Hours,
                                          }: Readonly<Props>): React.ReactElement {
  // Friendly empty state
  if (orders.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No orders found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {orders.map((order) => {
        const isEditable = isWithin72Hours(order.createdAt);
        const isUnread = unreadOrderIds.includes(order.id);

        return (
          <article
            key={order.id}
            className="relative w-full rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] p-4 sm:p-6 shadow-[0_4px_14px_0_var(--theme-shadow)] border border-[var(--theme-border)]"
          >
            {isUnread && <NotificationBadge />}

            {/* Card "open" area as a real button (no nesting inside other buttons) */}
            <button
              type="button"
              aria-label={`Open order for ${order.name}`}
              onClick={() => onCardClick(order)}
              className="w-full text-left rounded-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-lg underline">Name</p><p className="font-semibold">{order.name}</p></div>
                <div><p className="text-lg underline">Email</p><p className="font-semibold">{order.email}</p></div>
                <div><p className="text-lg underline">Business</p><p className="font-semibold">{order.businessName}</p></div>
                <div><p className="text-lg underline">Project Type</p><p className="font-semibold">{order.projectType}</p></div>
                <div><p className="text-lg underline">Budget</p><p className="font-semibold">{order.budget}</p></div>
                <div><p className="text-lg underline">Timeline</p><p className="font-semibold">{order.timeline}</p></div>
                <div className="sm:col-span-2"><p className="text-lg underline">Description</p><p className="font-medium">{order.description}</p></div>
                <div className="sm:col-span-2">
                  <p className="text-lg underline">Status</p>
                  <p className={`font-bold capitalize ${getStatusTextClasses(order.status)}`}>{order.status}</p>
                </div>
              </div>
            </button>

            {/* Actions row */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onEdit(order)}
                className="px-4 py-2 bg-[var(--theme-button)] text-[var(--theme-text-white)] cursor-pointer text-sm rounded shadow-md hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
              >
                Edit
              </button>

              {isEditable && (
                <button
                  type="button"
                  onClick={() => onCancel(order)}
                  disabled={order.status === 'cancelled'}
                  className={`px-4 py-2 text-sm rounded cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 ${
                    order.status === 'cancelled'
                      ? 'bg-gray-500 cursor-not-allowed text-white'
                      : 'bg-[var(--theme-border-red)] hover:bg-red-700 text-[var(--theme-text-white)]'
                  }`}
                >
                  {order.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                </button>
              )}

              <button
                type="button"
                onClick={() => onDownload(order.id)}
                className="px-4 py-2 bg-[var(--theme-card)] text-[var(--theme-text-white)] cursor-pointer text-sm rounded shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
              >
                Download Invoice
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
