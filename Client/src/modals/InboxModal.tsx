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
  const markAllReadForOrder: (orderId: number) => void = useNotificationStore(
    (s): ((orderId: number) => void) => s.markAllReadForOrder
  );
  const clearRead: () => void = useNotificationStore((s): (() => void) => s.clearRead);

  const handleClick: (orderId: number) => Promise<void> = async (orderId: number): Promise<void> => {
    try {
      const res: Response = await fetch(`/api/order/${orderId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        console.error(`Failed to mark order #${orderId} as read. Status: ${res.status}`);
        return;
      }
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

      <div className="max-h-[70vh] sm:max-h-[72vh] md:max-h-[75vh] overflow-y-auto pr-1 sm:pr-2">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 sm:text-[15px]">
            No notifications.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--theme-border)]">
            {items.map((n: Notification): React.ReactElement => (
              <li key={n.id} className="py-2 sm:py-3">
                <button
                  type="button"
                  onClick={(): Promise<void> => handleClick(n.orderId)}
                  className="w-full rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/40"
                >
                  <div className="flex items-start justify-between gap-3 p-3 sm:gap-4 sm:p-2">
                    <div className="min-w-0 flex-1 pr-2 sm:pr-3">
                      <p className="line-clamp-1 text-sm font-semibold sm:text-[15px]">
                        {n.title || `Update on Order #${n.orderId}`}
                      </p>

                      {n.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--theme-text)]/80 sm:line-clamp-3 sm:text-[13px]">
                          {n.message}
                        </p>
                      )}

                      <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!n.read && (
                      <span
                        aria-hidden="true"
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--theme-border-red)] sm:h-2.5 sm:w-2.5"
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
