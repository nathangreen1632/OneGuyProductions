import React, { type ReactElement } from 'react';
import { format } from 'date-fns';
import type { Order, OrderUpdateEntry } from '../types/order.types';
import { isWithin72Hours } from '../helpers/dateHelper';
import { useOrderStore } from '../store/useOrderStore';
import { useEditOrderStore } from '../store/useEditOrderStore';
import { useThreadModalStore } from '../store/useThreadModalStore';
import ThreadReplyModal from '../components/ThreadReplyModalLogic';

type TStatusBadgeClasses = (status: string) => string;

const getStatusBadgeClasses: TStatusBadgeClasses = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'complete': return ' text-emerald-600';
    case 'cancelled': return 'text-red-600';
    case 'in-progress': return 'text-yellow-500';
    case 'needs-feedback': return 'text-orange-600';
    case 'pending': return 'text-sky-600';
    default: return 'text-gray-600';
  }
};

export default function OrderTimelineView(): React.ReactElement {
  const { orders } = useOrderStore() as { orders: Order[] };
  const { openModal: openEditModal } = useEditOrderStore();
  const { open: openThreadModal } = useThreadModalStore();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {orders.map((order: Order): ReactElement => {
          const isEditable: boolean = isWithin72Hours(order.createdAt);

          return (
            <div
              key={order.id}
              className="rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] p-4 sm:p-6 shadow-[0_4px_14px_0_var(--theme-shadow)] border border-[var(--theme-border)]"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold">{order.projectType}</h3>
                <p className="text-sm text-[var(--theme-text)]">
                  {order.name} • {order.businessName}
                </p>
                <p className={`font-bold capitalize ${getStatusBadgeClasses(order.status)}`}>
                  {order.status}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Placed: {format(new Date(order.createdAt), 'PPP p')}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-[var(--theme-text)] mb-1">Description</p>
                <p className="text-sm font-medium">{order.description}</p>
              </div>

              <div className="flex flex-col gap-4 border-l-2 border-[var(--theme-border)] pl-4">
                {order.updates.map((update: OrderUpdateEntry): React.ReactElement => {
                  const uniqueKey: string =
                    `${update.user}-${update.timestamp}-${update.message.slice(0, 20)}`;

                  return (
                    <div key={uniqueKey} className="relative">
                      <div className="absolute -left-3 top-1.5 w-3 h-3 rounded-full bg-[var(--theme-border)]" />
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold">{update.user}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(update.timestamp), 'PPP p')}
                        </p>
                        <p className="text-sm">{update.message}</p>
                      </div>
                    </div>
                  );
                })}

                {order.updates.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No updates yet.</p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {isEditable && (
                  <button
                    onClick={(): void => openEditModal(order)}
                    className="px-4 py-2 bg-[var(--theme-button)] text-[var(--theme-text-white)] text-sm rounded shadow-md hover:bg-[var(--theme-hover)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                  >
                    Edit Order
                  </button>
                )}

                <button
                  onClick={(): void => openThreadModal(order.id)}
                  className="px-4 py-2 bg-sky-600 text-white text-sm rounded shadow-md cursor-pointer hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                >
                  View thread
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <ThreadReplyModal />
    </>
  );
}
