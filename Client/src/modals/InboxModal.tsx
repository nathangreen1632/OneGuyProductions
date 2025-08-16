import React from 'react';
import DescriptionModal from './DescriptionModal';
import { type Notification, useNotificationStore } from '../store/useNotificationStore';

interface InboxModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateToOrder?: (orderId: number) => void;
}

export default function InboxModal({
                                     open,
                                     onClose,
                                     onNavigateToOrder,
                                   }: Readonly<InboxModalProps>): React.ReactElement | null {
  const items: Notification[] = useNotificationStore((s): Notification[] => s.items);
  const markAllReadForOrder: (orderId: number) => void = useNotificationStore((s) => s.markAllReadForOrder);
  const clearRead: () => void = useNotificationStore((s): () => void => s.clearRead);

  const handleClick: (orderId: number) => Promise<void> = async (orderId: number): Promise<void> => {
    try {
      await fetch(`/api/order/${orderId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      console.error(`Failed to mark order #${orderId} as read.`);
      return;
    }

    markAllReadForOrder(orderId);
    if (onNavigateToOrder) onNavigateToOrder(orderId);
    else window.location.assign('/portal');
    onClose();
  };

  const hasAnyRead: boolean = items.some((n: Notification): boolean => n.read);

  return (
    <DescriptionModal open={open} onClose={onClose} title="Inbox">
      {hasAnyRead && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={clearRead}
            className="w-full sm:w-auto text-xs sm:text-[13px] px-3 py-2 rounded-lg border border-[var(--theme-border)] hover:bg-black/10 underline"
          >
            Clear Notifications
          </button>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="max-h-[70vh] sm:max-h-[72vh] md:max-h-[75vh] overflow-y-auto pr-1 sm:pr-2">
        {items.length === 0 ? (
          <p className="text-sm sm:text-[15px] text-gray-500 text-center py-6">No notifications.</p>
        ) : (
          <ul className="divide-y divide-[var(--theme-border)]">
            {items.map((n: Notification): React.ReactElement => (
              <li key={n.id} className="py-2 sm:py-3">
                <button
                  type="button"
                  onClick={(): Promise<void> => handleClick(n.orderId)}
                  className="w-full text-left rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/40"
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4 p-3 sm:p-2">
                    <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                      <p className="font-semibold text-sm sm:text-[15px] line-clamp-1">
                        {n.title || `Update on Order #${n.orderId}`}
                      </p>

                      {n.message && (
                        <p className="mt-0.5 text-xs sm:text-[13px] text-[var(--theme-text)]/80 line-clamp-2 sm:line-clamp-3">
                          {n.message}
                        </p>
                      )}

                      <p className="mt-1 text-[11px] sm:text-xs text-gray-500">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!n.read && (
                      <span
                        aria-hidden
                        className="mt-1 h-2.5 w-2.5 sm:h-2.5 sm:w-2.5 rounded-full bg-[var(--theme-border-red)] shrink-0"
                      />
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DescriptionModal>
  );

}
