import React, {type ReactElement} from 'react';
import type { AdminOrderRowDto } from '../../types/admin.types.ts';

export default function AdminOrdersTable({
  rows, loading, total, onRowClick,
}: Readonly<{ rows: AdminOrderRowDto[]; loading: boolean; total: number; onRowClick: (id: number) => void }>): React.ReactElement {
  if (loading) return <div className="p-4 text-sm">Loading…</div>;

  return (
    <div>
      <div className="md:hidden space-y-2">
        {rows.map((r): ReactElement => (
          <button
            key={r.id}
            onClick={(): void => onRowClick(r.id)}
            className="w-full rounded-2xl bg-[var(--theme-surface)] p-4 shadow-sm text-left"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.name}</div>
              {r.unreadCountForCustomer > 0 && (
                <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs text-white">
                  {r.unreadCountForCustomer === 1 ? '' : r.unreadCountForCustomer}
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-600">{r.projectType} · {r.status}</div>
            <div className="mt-1 text-xs text-gray-500">Last update {r.lastUpdateAt ?? '—'}</div>
          </button>
        ))}
      </div>

      <div className="hidden md:block rounded-2xl bg-[var(--theme-surface)] p-2 shadow-sm">
        <table className="w-full table-fixed">
          <thead className="text-left text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 w-24">Order</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2 w-40">Status</th>
              <th className="px-3 py-2 w-40">Assigned</th>
              <th className="px-3 py-2 w-40">Last Update</th>
              <th className="px-3 py-2 w-24">Unread</th>
              <th className="px-3 py-2 w-24">SLA(h)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((r): ReactElement => (
              <tr key={r.id} className="hover:bg-black/5 cursor-pointer" onClick={(): void => onRowClick(r.id)}>
                <td className="px-3 py-2">#{r.id}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.projectType}</td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
                <td className="px-3 py-2">{r.assignedAdminName ?? '—'}</td>
                <td className="px-3 py-2">{r.lastUpdateAt ?? '—'}</td>
                <td className="px-3 py-2">
                  {r.unreadCountForCustomer > 0 && (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs text-white">
                      {r.unreadCountForCustomer === 1 ? '' : r.unreadCountForCustomer}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{r.ageHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-2 text-xs text-gray-500">Total: {total}</div>
      </div>
    </div>
  );
}
