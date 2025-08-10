import React, { type ReactElement } from 'react';
import type { AdminOrderRowDto } from '../../types/admin.types.ts';

function getStatusTextClasses(status: string): string {
  switch (status?.toLowerCase()) {
    case 'complete':
      return 'text-emerald-600';
    case 'cancelled':
      return 'text-red-600';
    case 'in-progress':
      return 'text-yellow-500';
    case 'needs-feedback':
      return 'text-orange-600';
    case 'pending':
      return 'text-sky-600';
    default:
      return 'text-gray-600';
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default function AdminOrdersTable({
                                           rows, loading, total, onRowClick,
                                         }: Readonly<{ rows: AdminOrderRowDto[]; loading: boolean; total: number; onRowClick: (id: number) => void }>): React.ReactElement {
  if (loading) {
    return (
      <div className="p-4 text-sm">
        <div className="h-3 w-24 animate-pulse rounded bg-black/10" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-black/10" />
      </div>
    );
  }

  return (
    <div>
      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {rows.map((r): ReactElement => {
          const unread = r.unreadCountForCustomer ?? 0;
          const hasUnread = unread > 0;
          return (
            <button
              key={r.id}
              onClick={(): void => onRowClick(r.id)}
              className="group w-full rounded-2xl bg-[var(--theme-surface)] p-4 text-left shadow-sm outline-none ring-0 transition-shadow hover:shadow-[var(--theme-shadow)] focus-visible:ring-2 focus-visible:ring-[var(--theme-focus)]"
              aria-label={`Open order #${r.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[var(--theme-text)]">#{r.id} • {r.name}</div>
                  <div className="mt-0.5 text-xs text-gray-600">{r.projectType} · <span className={`${getStatusTextClasses(r.status)} capitalize`}>{r.status}</span></div>
                </div>

                {hasUnread && (
                  <span
                    className={`ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-semibold text-white shadow-sm ${
                      unread === 1 ? 'h-2 w-2 p-0 min-w-0' : ''
                    }`}
                    aria-label={unread === 1 ? 'Unread' : `${unread} unread`}
                    title={unread === 1 ? 'Unread' : `${unread} unread`}
                  >
                    {unread === 1 ? '' : unread}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>Assigned: {r.assignedAdminName ?? '—'}</span>
                <span>•</span>
                <span>Last update {formatDate(r.lastUpdateAt)}</span>
                <span>•</span>
                <span>SLA {r.ageHours}h</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="mt-2 hidden overflow-hidden rounded-2xl bg-[var(--theme-surface)] shadow-sm md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-10 bg-black/5 text-left text-xs text-gray-500 backdrop-blur">
            <tr>
              <th className="px-3 py-2 w-24 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Project</th>
              <th className="px-3 py-2 w-40 font-medium">Status</th>
              <th className="px-3 py-2 w-40 font-medium">Assigned</th>
              <th className="px-3 py-2 w-40 font-medium">Last Update</th>
              <th className="px-3 py-2 w-24 font-medium">Unread</th>
              <th className="px-3 py-2 w-24 font-medium">SLA(h)</th>
            </tr>
            </thead>
            <tbody className="text-sm">
            {rows.map((r, i): ReactElement => {
              const unread = r.unreadCountForCustomer ?? 0;
              const hasUnread = unread > 0;
              return (
                <tr
                  key={r.id}
                  className={`cursor-pointer transition-colors hover:bg-black/5 ${i % 2 === 1 ? 'bg-black/0' : 'bg-black/[0.03]'}`}
                  onClick={(): void => onRowClick(r.id)}
                  tabIndex={0}
                  onKeyDown={(e): void => { if (e.key === 'Enter' || e.key === ' ') onRowClick(r.id); }}
                  aria-label={`Open order #${r.id}`}
                >
                  <td className="px-3 py-2 font-semibold text-[var(--theme-text)]">#{r.id}</td>
                  <td className="truncate px-3 py-2">{r.name}</td>
                  <td className="truncate px-3 py-2">{r.projectType}</td>
                  <td className={`px-3 py-2 capitalize ${getStatusTextClasses(r.status)}`}>{r.status}</td>
                  <td className="truncate px-3 py-2">{r.assignedAdminName ?? '—'}</td>
                  <td className="px-3 py-2">{formatDate(r.lastUpdateAt)}</td>
                  <td className="px-3 py-2">
                    {hasUnread && (
                      <span
                        className={`inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-semibold text-white shadow-sm ${
                          unread === 1 ? 'h-2 w-2 p-0 min-w-0' : ''
                        }`}
                        aria-label={unread === 1 ? 'Unread' : `${unread} unread`}
                        title={unread === 1 ? 'Unread' : `${unread} unread`}
                      >
                          {unread === 1 ? '' : unread}
                        </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{r.ageHours}</td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
          <span>Total: {total}</span>
          <span className="rounded-md bg-black/5 px-2 py-0.5">Showing {rows.length}</span>
        </div>
      </div>
    </div>
  );
}
