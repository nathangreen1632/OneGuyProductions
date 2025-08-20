import React from 'react';
import toast from 'react-hot-toast';
import DescriptionModal from './DescriptionModal';
import { type Notification, useNotificationStore } from '../store/useNotification.store';
import {type ApiErrorBody, isNonEmptyString, readJsonSafe} from "../helpers/http.helper";

interface InboxModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateToOrder?: (orderId: number) => void;
}

const LOG_PREFIX = 'InboxModal';

function errorMessageFromStatus(res: Response, body: ApiErrorBody | null, orderId: number): string {
  if (body?.error && isNonEmptyString(body.error)) return body.error;
  if (body?.message && isNonEmptyString(body.message)) return body.message;

  if (res.status >= 500) return `Server error while marking order #${orderId} as read.`;
  if (res.status === 404) return `Order #${orderId} was not found.`;
  if (res.status === 401 || res.status === 403) return `You do not have permission to update order #${orderId}.`;
  if (res.status === 400) return `Invalid request while updating order #${orderId}.`;
  return `Failed to update order #${orderId}.`;
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
        const body: ApiErrorBody | null = await readJsonSafe(res, LOG_PREFIX);
        const msg: string = errorMessageFromStatus(res, body, orderId);
        console.warn(`${LOG_PREFIX}: mark read failed`, { status: res.status, msg, body, orderId });
        toast.error(msg);
        return;
      }
    } catch (err) {
      console.error(`${LOG_PREFIX}: network or unexpected error while marking read`, err);
      const offlineHint: ' You appear to be offline.' | '' =
        typeof navigator !== 'undefined' &&
        'onLine' in navigator &&
        (navigator).onLine === false
          ? ' You appear to be offline.'
          : '';
      toast.error(`Unable to reach the server to update order #${orderId}.${offlineHint}`);
      return;
    }

    try {
      markAllReadForOrder(orderId);
    } catch (err) {
      console.error(`${LOG_PREFIX}: markAllReadForOrder threw`, err);
    }

    try {
      if (onNavigateToOrder) onNavigateToOrder(orderId);
      else if (typeof window !== 'undefined' && window?.location) window.location.assign('/portal');
    } catch (err) {
      console.error(`${LOG_PREFIX}: navigation failed`, err);
      toast('Read status updated, but navigation failed. Please open the order manually.', { icon: 'ℹ️' });
    }

    try {
      onClose();
    } catch (err) {
      console.error(`${LOG_PREFIX}: onClose threw`, err);
    }
  };

  let hasAnyRead: boolean = false;
  try {
    hasAnyRead = Array.isArray(items) && items.some((n: Notification): boolean => Boolean(n.read));
  } catch (err) {
    console.error(`${LOG_PREFIX}: computing hasAnyRead failed`, err);
  }

  return (
    <DescriptionModal open={open} onClose={onClose} title="Inbox">
      {hasAnyRead && (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={(): void => {
              try {
                clearRead();
                toast.success('Cleared read notifications.');
              } catch (err) {
                console.error(`${LOG_PREFIX}: clearRead threw`, err);
                toast.error('Unable to clear notifications.');
              }
            }}
            className="w-full sm:w-auto text-xs sm:text-[13px] px-3 py-2 rounded-lg border border-[var(--theme-border)] hover:bg-black/10 underline"
          >
            Clear Notifications
          </button>
        </div>
      )}

      <div className="max-h-[70vh] sm:max-h-[72vh] md:max-h-[75vh] overflow-y-auto pr-1 sm:pr-2">
        {(!items || items.length === 0) ? (
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

                      {isNonEmptyString(n.message) && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--theme-text)]/80 sm:line-clamp-3 sm:text-[13px]">
                          {n.message}
                        </p>
                      )}

                      <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">
                        {((): string => {
                          try {
                            const d = new Date(n.createdAt);
                            const label: string | null = isNaN(d.getTime()) ? null : d.toLocaleString();
                            return label ?? '—';
                          } catch {
                            return '—';
                          }
                        })()}
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
