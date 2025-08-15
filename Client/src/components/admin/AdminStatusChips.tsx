import { type ReactElement, useState } from 'react';
import type { OrderStatus } from '../../types/order.types';
import { useAdminStore } from '../../store/useAdminStore';
import AdminStatusChipsView from '../../jsx/admin/adminStatusChipsView';

const statuses: OrderStatus[] = ['pending', 'in-progress', 'needs-feedback', 'complete', 'cancelled'];

function activeClasses(s: OrderStatus): string {
  switch (s) {
    case 'complete':       return 'bg-emerald-600 text-white';
    case 'cancelled':      return 'bg-red-600 text-white';
    case 'in-progress':    return 'bg-yellow-500 text-black';
    case 'needs-feedback': return 'bg-orange-600 text-white';
    case 'pending':
    default:               return 'bg-sky-600 text-white';
  }
}

export default function AdminStatusChips({
                                           orderId,
                                           status,
                                         }: Readonly<{ orderId: number; status: OrderStatus }>): ReactElement {
  const [busy, setBusy] = useState(false);
  const { updateStatus } = useAdminStore();

  const onStatusClick: (next: OrderStatus) => Promise<void> = async (next: OrderStatus): Promise<void> => {
    if (busy || next === status) return;
    setBusy(true);
    try {
      await updateStatus(orderId, next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminStatusChipsView
      status={status}
      busy={busy}
      statuses={statuses}
      activeClasses={activeClasses}
      onStatusClick={onStatusClick}
    />
  );
}
