import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import type { AdminOrderRowDto } from '../../types/admin.types';
import AdminOrdersTableView from '../../jsx/admin/adminOrdersTableView';

function getStatusTextClasses(status: string): string {
  try {
    switch (status?.toLowerCase()) {
      case 'complete': return 'text-emerald-600';
      case 'cancelled': return 'text-red-600';
      case 'in-progress': return 'text-yellow-500';
      case 'needs-feedback': return 'text-orange-600';
      case 'pending': return 'text-sky-600';
      default:
        if (!status && status !== '') {
          console.warn('AdminOrdersTable: unknown status', status);
          toast.error('AdminOrdersTable: unknown status');
        }
        return 'text-gray-600';
    }
  } catch (err) {
    console.error('AdminOrdersTable: getStatusTextClasses error', err);
    toast.error('AdminOrdersTable: status style error');
    return 'text-gray-600';
  }
}

function formatDate(value?: string | null): string {
  try {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  } catch (err) {
    console.error('AdminOrdersTable: formatDate error', err);
    toast.error('AdminOrdersTable: date format error');
    return '—';
  }
}

export default function AdminOrdersTable({
                                           rows,
                                           loading,
                                           total,
                                           page,
                                           pageSize,
                                           onRowClick,
                                         }: Readonly<{
  rows: AdminOrderRowDto[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onRowClick: (id: number) => void;
}>): React.ReactElement {

  useEffect((): void => {
    if (!Array.isArray(rows)) {
      console.warn('AdminOrdersTable: rows is not an array');
      toast.error('AdminOrdersTable: invalid rows');
    }
    if (typeof onRowClick !== 'function') {
      console.error('AdminOrdersTable: onRowClick is not a function');
      toast.error('AdminOrdersTable: invalid row click handler');
    }
  }, [rows, onRowClick]);

  const safeRows: AdminOrderRowDto[] = Array.isArray(rows) ? rows : [];
  const safeLoading: boolean = Boolean(loading);
  const safeTotal: number = Number.isFinite(total) && total >= 0 ? total : 0;
  const safePageSize: number = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  const safePage: number =
    Number.isFinite(page) && page >= 0 ? page : 0;

  const onRowClickSafe: (id: number) => void = (id: number): void => {
    try {
      if (typeof onRowClick !== 'function') {
        console.error('AdminOrdersTable: onRowClick not callable');
        toast.error('AdminOrdersTable: cannot open row');
        return;
      }
      if (!Number.isFinite(id)) {
        console.warn('AdminOrdersTable: invalid row id', id);
        toast.error('AdminOrdersTable: invalid row id');
        return;
      }
      onRowClick(id);
    } catch (err) {
      console.error('AdminOrdersTable: error handling row click', err);
      toast.error('AdminOrdersTable: failed to open row');
    }
  };

  return (
    <AdminOrdersTableView
      rows={safeRows}
      loading={safeLoading}
      total={safeTotal}
      page={safePage}
      pageSize={safePageSize}
      onRowClick={onRowClickSafe}
      getStatusTextClasses={getStatusTextClasses}
      formatDate={formatDate}
    />
  );
}
