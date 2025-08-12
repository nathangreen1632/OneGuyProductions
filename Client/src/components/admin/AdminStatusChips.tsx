import React, { type ReactElement, useState } from 'react';
import type { OrderStatus } from '../../types/order.types';
import { useAdminStore } from '../../store/useAdminStore';

const statuses: OrderStatus[] = ['pending', 'in-progress', 'needs-feedback', 'complete', 'cancelled'];

function activeClasses(s: OrderStatus): string {
  switch (s) {
    case 'complete':
      return 'bg-emerald-600 text-white';
    case 'cancelled':
      return 'bg-red-600 text-white';
    case 'in-progress':
      return 'bg-yellow-500 text-black';
    case 'needs-feedback':
      return 'bg-orange-600 text-white';
    case 'pending':
    default:
      return 'bg-sky-600 text-white';
  }
}

export default function AdminStatusChips({
                                           orderId,
                                           status,
                                         }: Readonly<{ orderId: number; status: OrderStatus }>): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const { updateStatus } = useAdminStore();

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s: OrderStatus): ReactElement => {
        const active: boolean = s === status;
        const base: string =
          'rounded-full px-3 py-1 text-xs transition-all outline-none shadow-sm ' +
          'focus-visible:ring-2 focus-visible:ring-[var(--theme-focus)] hover:shadow-[var(--theme-shadow)]';
        const inactive: string =
          'bg-[var(--theme-surface)] text-[var(--theme-text)] border border-[var(--theme-border)]/40 ' +
          'hover:bg-black/5 disabled:opacity-60';
        const disabledState = busy || active ? 'cursor-not-allowed opacity-70' : '';

        const handleClick: () => Promise<void> = async (): Promise<void> => {
          if (busy || active) return;
          setBusy(true);
          try {
            await updateStatus(orderId, s);
          } finally {
            setBusy(false);
          }
        };

        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            disabled={busy || active}
            onClick={handleClick}
            className={[base, active ? activeClasses(s) : inactive, disabledState].join(' ')}
            title={active ? `Status: ${s}` : `Set status to ${s}`}
          >
            <span className="capitalize">{s.replace('-', ' ')}</span>
          </button>
        );
      })}
    </div>
  );
}
