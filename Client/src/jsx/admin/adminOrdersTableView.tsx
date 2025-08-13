import React, { type ReactElement } from 'react';
import type { AdminOrderRowDto } from '../../types/admin.types';
import Spinner from '../../common/Spinner';

interface AdminOrdersTableViewProps {
  rows: AdminOrderRowDto[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onRowClick: (id: number) => void;
  getStatusTextClasses: (status: string) => string;
  formatDate: (value?: string | null) => string;
}

export default function AdminOrdersTableView({
                                               rows,
                                               loading,
                                               total,
                                               page,
                                               pageSize,
                                               onRowClick,
                                               getStatusTextClasses,
                                               formatDate,
                                             }: Readonly<AdminOrdersTableViewProps>): React.ReactElement {
  const firstLoad: boolean = loading && rows.length === 0;
  const start: number = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end: number = Math.min((page - 1) * pageSize + rows.length, total);

  if (firstLoad) {
    return <Spinner size={32} color="#3b82f6" className="mx-auto my-6" />;
  }

  return (
    <>
      {loading && rows.length > 0 && (
        <div className="md:hidden mb-1 flex justify-end">
          <span className="rounded-md bg-[var(--theme-card)]/40 px-2 py-0.5 text-[10px] text-[var(--theme-text)]">
            Refreshing…
          </span>
        </div>
      )}

      <div className="space-y-2 md:hidden">
        {rows.map((r: AdminOrderRowDto): ReactElement => {
          const unread: any = (r as any).unreadCountForCustomer ?? (r as any).unreadCount ?? 0;
          const hasUnread: boolean = unread > 0;

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
                  <div className="mt-0.5 text-xs text-gray-600">
                    {r.projectType} ·{' '}
                    <span className={`${getStatusTextClasses(r.status)} capitalize`}>{r.status}</span>
                  </div>
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
                <span>Assigned: {(r as any).assignedAdminName ?? '—'}</span>
                <span>•</span>
                <span>Last update {formatDate((r as any).lastUpdateAt)}</span>
                <span>•</span>
                <span>SLA {r.ageHours}h</span>
              </div>
            </button>
          );
        })}
      </div>

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
            {rows.map((r: AdminOrderRowDto, i: number): ReactElement => {
              const unread: number = (r as any).unreadCountForCustomer ?? 0;
              const hasUnread: boolean = unread > 0;

              return (
                <tr
                  key={r.id}
                  className={`cursor-pointer transition-colors hover:bg-black/5 ${
                    i % 2 === 1 ? 'bg-black/0' : 'bg-black/[0.03]'
                  }`}
                  onClick={(): void => onRowClick(r.id)}
                  tabIndex={0}
                  onKeyDown={(e): void => {
                    if (e.key === 'Enter' || e.key === ' ') onRowClick(r.id);
                  }}
                  aria-label={`Open order #${r.id}`}
                >
                  <td className="px-3 py-2 font-semibold text-[var(--theme-text)]">#{r.id}</td>
                  <td className="truncate px-3 py-2">{r.name}</td>
                  <td className="truncate px-3 py-2">{r.projectType}</td>
                  <td className={`px-3 py-2 capitalize ${getStatusTextClasses(r.status)}`}>{r.status}</td>
                  <td className="truncate px-3 py-2">
                    {(r as any).assignedAdminName ??
                      ((r as any).assignedAdminId ? `#${(r as any).assignedAdminId}` : '—')}
                  </td>
                  <td className="px-3 py-2">{formatDate((r as any).lastUpdateAt ?? (r as any).latestUpdateAt)}</td>
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
          <div className="flex items-center gap-2">
            {loading && rows.length > 0 && (
              <span className="rounded-md bg-black/5 px-2 py-0.5">Refreshing…</span>
            )}
            <span className="rounded-md bg-black/5 px-2 py-0.5">
              Showing {start === 0 ? 0 : start}–{end} of {total}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
