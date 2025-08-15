import React from 'react';
import DescriptionModal from './DescriptionModal';
import {type Notification, useNotificationStore} from '../store/useNotificationStore';

interface InboxModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional navigation hook */
  onNavigateToOrder?: (orderId: number) => void;
}

export default function InboxModal({
                                     open,
                                     onClose,
                                     onNavigateToOrder,
                                   }: Readonly<InboxModalProps>): React.ReactElement | null {
  const items: Notification[] = useNotificationStore(s => s.items);
  const markAllReadForOrder: (orderId: number) => void = useNotificationStore(s => s.markAllReadForOrder);
  const clearRead: () => void = useNotificationStore(s => s.clearRead);

  const handleClick: (orderId: number) => Promise<void> = async (orderId: number): Promise<void> => {
    try {
      await fetch(`/api/order/${orderId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {

    }

    markAllReadForOrder(orderId);
    if (onNavigateToOrder) onNavigateToOrder(orderId);
    else window.location.assign('/portal'); // customer land
    onClose();
  };

  const hasAnyRead: boolean = items.some(n => n.read);

  return (
    <DescriptionModal open={open} onClose={onClose} title="Inbox">
      {hasAnyRead && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={clearRead}
            className="text-xs px-2 py-1 rounded border border-[var(--theme-border)] hover:bg-black/10 underline"
          >
            Clear Notifications
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications.</p>
      ) : (
        <ul className="divide-y divide-[var(--theme-border)]">
          {items.map(n => (
            <li key={n.id} className="py-3">
              <button
                type="button"
                onClick={(): Promise<void> => handleClick(n.orderId)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="pr-3">
                    <p className="font-semibold text-sm">
                      {n.title || `Update on Order #${n.orderId}`}
                    </p>
                    {n.message && (
                      <p className="text-xs text-[var(--theme-text)]/80 line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-gray-500">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <span
                      aria-hidden
                      className="mt-1 h-2 w-2 rounded-full bg-[var(--theme-border-red)] inline-block"
                    />
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DescriptionModal>
  );
}
