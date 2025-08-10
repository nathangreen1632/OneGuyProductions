import React, {type ReactElement, useState} from 'react';
import type { OrderStatus } from '../../types/order.types';
import { useAdminStore } from '../../store/useAdminStore.ts';

const statuses: OrderStatus[] = ['pending', 'in-progress', 'needs-feedback', 'complete', 'cancelled'];

export default function AdminStatusChips({ orderId, status }: Readonly<{ orderId: number; status: OrderStatus }>): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const { updateStatus } = useAdminStore();

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s: OrderStatus): ReactElement => {
        const active: boolean = s === status;
        return (
          <button
            key={s}
            disabled={busy || active}
            onClick={async (): Promise<void> => {
              setBusy(true);
              await updateStatus(orderId, s);
              setBusy(false);
            }}
            className={[
              'rounded-full px-3 py-1 text-xs shadow-sm',
              active ? 'bg-emerald-600 text-white' : 'bg-black/10 dark:bg-white/10',
            ].join(' ')}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
