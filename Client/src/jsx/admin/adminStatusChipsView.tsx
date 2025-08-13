import React, { type ReactElement } from 'react';
import type { OrderStatus } from '../../types/order.types';

interface AdminStatusChipsViewProps {
  status: OrderStatus;
  busy: boolean;
  statuses: ReadonlyArray<OrderStatus>;
  activeClasses: (s: OrderStatus) => string;
  onStatusClick: (s: OrderStatus) => void;
}

export default function AdminStatusChipsView({
                                               status,
                                               busy,
                                               statuses,
                                               activeClasses,
                                               onStatusClick,
                                             }: Readonly<AdminStatusChipsViewProps>): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s: OrderStatus): React.ReactElement => {
        const active: boolean = s === status;
        const base: string =
          'rounded-full px-3 py-1 text-xs transition-all outline-none shadow-sm ' +
          'focus-visible:ring-2 focus-visible:ring-[var(--theme-focus)] hover:shadow-[var(--theme-shadow)]';
        const inactive: string =
          'bg-[var(--theme-surface)] text-[var(--theme-text)] border border-[var(--theme-border)]/40 ' +
          'hover:bg-black/5 disabled:opacity-60';
        const disabledState = busy || active ? 'cursor-not-allowed opacity-70' : '';

        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            disabled={busy || active}
            onClick={(): void => onStatusClick(s)}
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
