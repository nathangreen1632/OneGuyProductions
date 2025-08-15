import React from 'react';
import DescriptionModal from './DescriptionModal';
import { useNotificationStore } from '../store/useNotificationStore';

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
  const items = useNotificationStore(s => s.items);
  const markAllReadForOrder = useNotificationStore(s => s.markAllReadForOrder);

  const handleClick = (orderId: number): void => {
    markAllReadForOrder(orderId);
    if (onNavigateToOrder) onNavigateToOrder(orderId);
    else window.location.assign('/portal'); // customer land
    onClose();
  };

  return (
    <DescriptionModal open={open} onClose={onClose} title="Inbox">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications.</p>
      ) : (
        <ul className="divide-y divide-[var(--theme-border)]">
          {items.map(n => (
            <li key={n.id} className="py-3">
              <button
                type="button"
                onClick={() => handleClick(n.orderId)}
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
                    <span aria-hidden className="mt-1 h-2 w-2 rounded-full bg-[var(--theme-border-red)] inline-block" />
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
