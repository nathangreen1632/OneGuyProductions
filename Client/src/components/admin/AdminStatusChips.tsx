import { type ReactElement, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { OrderStatus } from '../../types/order.types';
import { useAdminStore} from '../../store/useAdmin.store';
import AdminStatusChipsView from '../../jsx/admin/adminStatusChipsView';

const ALL_STATUSES: OrderStatus[] = ['pending', 'in-progress', 'needs-feedback', 'complete', 'cancelled'];

function isValidStatus(s: unknown): s is OrderStatus {
  return typeof s === 'string' && (ALL_STATUSES as string[]).includes(s);
}

function activeClasses(s: OrderStatus): string {
  try {
    switch (s) {
      case 'complete':       return 'bg-emerald-600 text-white';
      case 'cancelled':      return 'bg-red-600 text-white';
      case 'in-progress':    return 'bg-yellow-500 text-black';
      case 'needs-feedback': return 'bg-orange-600 text-white';
      case 'pending':        return 'bg-sky-600 text-white';
      default:
        console.warn('AdminStatusChips: unknown status for classes', s);
        toast.error('AdminStatusChips: unknown status');
        return 'bg-gray-600 text-white';
    }
  } catch (err) {
    console.error('AdminStatusChips: activeClasses failed', err);
    toast.error('AdminStatusChips: failed to compute classes');
    return 'bg-gray-600 text-white';
  }
}

export default function AdminStatusChips({
                                           orderId,
                                           status,
                                         }: Readonly<{ orderId: number; status: OrderStatus }>): ReactElement {
  const [busy, setBusy] = useState(false);
  const store = useAdminStore();

  useMemo((): void => {
    if (!Number.isFinite(orderId) || orderId <= 0) {
      console.warn('AdminStatusChips: invalid orderId', orderId);
      toast.error('AdminStatusChips: invalid order id');
    }
    if (!isValidStatus(status)) {
      console.warn('AdminStatusChips: invalid initial status', status);
      toast.error('AdminStatusChips: invalid initial status');
    }
    if (typeof store?.updateStatus !== 'function') {
      console.error('AdminStatusChips: updateStatus is not a function');
      toast.error('AdminStatusChips: internal error (updateStatus unavailable)');
    }
  }, [orderId, status, store?.updateStatus]);

  const safeStatuses: OrderStatus[] = useMemo((): OrderStatus[] => {
    return ALL_STATUSES.filter(isValidStatus);
  }, []);

  const onStatusClick: (next: OrderStatus) => Promise<void> = async (next: OrderStatus): Promise<void> => {
    try {
      if (busy) {
        console.warn('AdminStatusChips: click ignored while busy');
        toast.error('Please wait… still updating');
        return;
      }

      if (!isValidStatus(next)) {
        console.warn('AdminStatusChips: invalid next status', next);
        toast.error('Invalid status selected');
        return;
      }

      if (!isValidStatus(status)) {
        console.warn('AdminStatusChips: current status invalid; blocking update', status);
        toast.error('Cannot change status from an invalid state');
        return;
      }

      if (next === status) {
        console.warn('AdminStatusChips: status unchanged', next);
        toast.error('Status is already set');
        return;
      }

      if (!Number.isFinite(orderId) || orderId <= 0) {
        console.error('AdminStatusChips: cannot update, invalid orderId', orderId);
        toast.error('Cannot update status: invalid order id');
        return;
      }

      if (typeof store?.updateStatus !== 'function') {
        console.error('AdminStatusChips: updateStatus unavailable on click');
        toast.error('Cannot update status (internal error)');
        return;
      }

      setBusy(true);

      let ok: boolean;
      try {
        const result: boolean = await store.updateStatus(orderId, next);
        ok = result === undefined ? true : Boolean(result);
      } catch (err) {
        console.error('AdminStatusChips: updateStatus threw', err);
        toast.error('Failed to update status');
        ok = false;
      } finally {
        setBusy(false);
      }

      if (!ok) {
        console.warn('AdminStatusChips: updateStatus returned falsy', { orderId, next });
        toast.error('Status update did not complete');
      }
    } catch (err) {
      console.error('AdminStatusChips: unexpected error in onStatusClick', err);
      toast.error('Unexpected error while changing status');
      setBusy(false);
    }
  };

  return (
    <AdminStatusChipsView
      status={isValidStatus(status) ? status : 'pending'}
      busy={Boolean(busy)}
      statuses={safeStatuses}
      activeClasses={activeClasses}
      onStatusClick={onStatusClick}
    />
  );
}
