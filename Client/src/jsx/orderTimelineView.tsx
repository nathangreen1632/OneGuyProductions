import React, { type ReactElement, useMemo, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import type { Order, OrderUpdateEntry } from '../types/order.types';
import { useOrderStore } from '../store/useOrderStore';
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

/** Expanded state with helpers */
function useExpandedSet(): {
  expanded: Set<number>;
  isExpanded: (id: number) => boolean;
  toggle: (id: number) => void;
  close: (id: number) => void;
  closeAll: () => void;
} {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function isExpanded(id: number): boolean {
    return expanded.has(id);
  }
  function toggle(id: number): void {
    setExpanded((prev): Set<number> => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function close(id: number): void {
    setExpanded((prev): Set<number> => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
  function closeAll(): void {
    setExpanded(new Set());
  }

  return { expanded, isExpanded, toggle, close, closeAll };
}

function LatestUpdatePreview({ updates }: Readonly<{ updates: OrderUpdateEntry[] }>): ReactElement {
  const latest = useMemo<OrderUpdateEntry | null>(() => {
    if (!updates || updates.length === 0) return null;
    return updates[updates.length - 1] ?? null;
  }, [updates]);

  if (!latest) {
    return <span className="text-sm text-gray-400 italic">No updates yet.</span>;
  }

  const ts = format(new Date(latest.timestamp), 'PPP p');
  const preview = latest.message.length > 96
    ? `${latest.message.slice(0, 96)}…`
    : latest.message;

  return (
    <span className="text-sm text-[var(--theme-text)]/80">
      <span className="font-semibold">{latest.user}</span>{' '}
      <span className="text-gray-500">({ts})</span>
      <span className="mx-2 text-gray-500">•</span>
      <span className="align-middle">{preview}</span>
    </span>
  );
}

export default function OrderTimelineView(): React.ReactElement {
  const { orders } = useOrderStore() as { orders: Order[] };
  const { open: openThreadModal } = useThreadModalStore();
  const { expanded, isExpanded, toggle, close } = useExpandedSet();

  // Keep a ref to each card container by order id
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  // Close expanded card(s) when clicking outside their container
  useEffect(() => {
    function onPointerDown(e: PointerEvent): void {
      const target = e.target as Node;
      // For every expanded card, if click is outside, close it
      expanded.forEach((id) => {
        const el = cardRefs.current.get(id);
        if (el && !el.contains(target)) {
          close(id);
        }
      });
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded, close]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 max-w-[85vw] mx-auto items-start">
        {orders.map((order: Order): ReactElement => {
          const expandedCard = isExpanded(order.id);
          const panelId = `order-updates-${order.id}`;

          return (
            <div
              key={order.id}
              ref={(el) => {
                if (el) cardRefs.current.set(order.id, el);
                else cardRefs.current.delete(order.id);
              }}
              className="pt-4 m-2 break-inside-avoid rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] p-4 sm:p-6 shadow-[0_4px_14px_0_var(--theme-shadow)] border border-[var(--theme-border)]"
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold">{order.projectType}</h3>
                <p className="text-sm text-[var(--theme-text)]">
                  {order.name} • {order.businessName}
                </p>
                <div className="text-sm font-semibold text-[var(--theme-text)]/90">
                  Order #: {order.id}
                </div>
                <p className={`font-bold capitalize ${getStatusBadgeClasses(order.status)}`}>
                  {order.status}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Placed: {format(new Date(order.createdAt), 'PPP p')}
                </p>
              </div>

              {/* Toggle row */}
              <div className="mt-1">
                <button
                  type="button"
                  aria-expanded={expandedCard}
                  aria-controls={panelId}
                  onClick={(): void => toggle(order.id)}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--theme-text)] outline-none"
                >
                  <ChevronRight
                    className={`h-4 w-4 text-red-500 transition-transform duration-200 ${expandedCard ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Updates ({order.updates.length})</span>
                </button>

                {/* Collapsed summary */}
                {!expandedCard && (
                  <div className="mt-2">
                    <LatestUpdatePreview updates={order.updates} />
                  </div>
                )}
              </div>

              {/* Expanded timeline */}
              {expandedCard && (
                <div
                  id={panelId}
                  className="mt-3 flex flex-col gap-4 border-l-2 border-[var(--theme-border)] pl-4"
                >
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
                          <p className="text-sm break-words">{update.message}</p>
                        </div>
                      </div>
                    );
                  })}
                  {order.updates.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No updates yet.</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pt-6 flex gap-3">
                <button
                  onClick={(): void => openThreadModal(order.id)}
                  className="px-4 py-2 bg-sky-600 text-white text-sm rounded shadow-md cursor-pointer hover:bg-sky-700"
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
