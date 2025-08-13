import React from 'react';
import type { AdminOrderRowDto } from '../../types/admin.types';
import AdminOrdersTableView from '../../jsx/admin/adminOrdersTableView';

function getStatusTextClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'complete': return 'text-emerald-600';
    case 'cancelled': return 'text-red-600';
    case 'in-progress': return 'text-yellow-500';
    case 'needs-feedback': return 'text-orange-600';
    case 'pending': return 'text-sky-600';
    default: return 'text-gray-600';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
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
  return (
    <AdminOrdersTableView
      rows={rows}
      loading={loading}
      total={total}
      page={page}
      pageSize={pageSize}
      onRowClick={onRowClick}
      getStatusTextClasses={getStatusTextClasses}
      formatDate={formatDate}
    />
  );
}
