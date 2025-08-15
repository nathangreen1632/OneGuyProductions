import React, { type ReactElement, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Order } from '../types/order.types';
import { format } from 'date-fns';
import DescriptionModal from '../modals/DescriptionModal';
import NotificationBadge from '../common/NotificationBadge';
import { useNotificationStore } from '../store/useNotificationStore';

interface IOrderCardViewProps {
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
                                        orders = [],
                                        onCardClick: _onCardClick,
                                        onEdit,
                                        onCancel,
                                        onDownload,
                                        getStatusTextClasses,
                                        isWithin72Hours,
                                      }: Readonly<IOrderCardViewProps>): React.ReactElement {
  const [modalOrderId, setModalOrderId] = useState<number | null>(null);

  const items = useNotificationStore((s) => s.items);
  const unreadOrderIds = useMemo<number[]>(
    () => items.filter((n) => !n.read).map((n) => n.orderId),
    [items]
  );
  const unreadOrderIdsSet = useMemo<Set<number>>(
    () => new Set<number>(unreadOrderIds),
    [unreadOrderIds]
  );

  const modalOrder: Order | null = useMemo(
    () => (modalOrderId ? orders.find((o) => o.id === modalOrderId) ?? null : null),
    [modalOrderId, orders]
  );

  const openDescriptionModal = (orderId: number): void => setModalOrderId(orderId);
  const closeDescriptionModal = (): void => setModalOrderId(null);

  const hasOrders = orders.length > 0;

  return (
    <>
      {!hasOrders ? (
        <div className="p-6 text-center text-gray-500">No orders found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 max-w-[85vw] mx-auto items-start">
          {orders.map((order: Order): ReactElement => {
            const isEditable: boolean = isWithin72Hours(order.createdAt);

            const shouldTruncate = order.description.length > 300;
            const displayDescription = shouldTruncate
              ? `${order.description.slice(0, 300)}…`
              : order.description;

            return (
              <article
                key={order.id}
                className={`relative pt-4 m-2 break-inside-avoid rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] p-4 sm:p-6 shadow-[0_4px_14px_0_var(--theme-shadow)] border ${
                  unreadOrderIdsSet.has(order.id)
                    ? 'border-transparent blink-border-3'
                    : 'border-[var(--theme-border)]'
                }`}
              >
              {/* Red dot */}
                {unreadOrderIdsSet.has(order.id) && <NotificationBadge />}

                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">{order.projectType}</h3>
                    <p className="text-sm text-[var(--theme-text)]">
                      {order.name} • {order.businessName}
                    </p>
                    <div className="text-sm font-semibold text-[var(--theme-text)]/90">
                      Order #: {order.id}
                    </div>
                    <p className={`font-bold capitalize ${getStatusTextClasses(order.status)}`}>
                      {order.status}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Placed: {format(new Date(order.createdAt), 'PPP p')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-lg underline">Email</p>
                      <p className="font-semibold text-sm break-words">{order.email}</p>
                    </div>
                    <div>
                      <p className="text-lg underline">Budget</p>
                      <p className="font-semibold text-sm">{order.budget}</p>
                    </div>
                    <div>
                      <p className="text-lg underline">Timeline</p>
                      <p className="font-semibold text-sm">{order.timeline}</p>
                    </div>
                  </div>

                  <div className="mt-4 sm:col-span-2">
                    <p className="text-lg underline">Description</p>
                    <p className="text-sm font-medium break-words">{displayDescription}</p>

                    {shouldTruncate && (
                      <button
                        type="button"
                        onClick={(e): void => {
                          e.stopPropagation();
                          openDescriptionModal(order.id);
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-red-500 text-xs focus:outline-none hover:underline"
                        aria-haspopup="dialog"
                        aria-label={`Show full description for order ${order.id}`}
                      >
                        <ChevronRight className="h-3 w-3" />
                        Show more
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={(): void => onEdit(order)}
                    className="px-4 py-2 bg-[var(--theme-button)] text-[var(--theme-text-white)] cursor-pointer text-sm rounded shadow-md hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                  >
                    Edit
                  </button>

                  {isEditable && (
                    <button
                      type="button"
                      onClick={(): void => onCancel(order)}
                      disabled={order.status === 'cancelled'}
                      className={`px-4 py-2 text-sm rounded cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 ${
                        order.status === 'cancelled'
                          ? 'bg-[var(--theme-button-gray)] cursor-not-allowed text-white'
                          : 'bg-[var(--theme-border-red)] hover:bg-[var(--theme-button-red)] text-[var(--theme-text-white)]'
                      }`}
                    >
                      {order.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(): void => onDownload(order.id)}
                    className="px-4 py-2 bg-[var(--theme-card)] text-[var(--theme-text-white)] cursor-pointer text-sm rounded shadow-md hover:bg-[var(--theme-card-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
                  >
                    Download Invoice
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <DescriptionModal
        open={!!modalOrder}
        title={modalOrder ? `Order #${modalOrder.id} — Full Description` : 'Order'}
        onClose={closeDescriptionModal}
      >
        {modalOrder && (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {modalOrder.description}
          </p>
        )}
      </DescriptionModal>
    </>
  );
}
