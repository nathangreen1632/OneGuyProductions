import React, {type ChangeEvent} from 'react';
import { useAdminUiStore } from '../../store/useAdminUiStore.ts';

export default function AdminFilters(): React.ReactElement {
  const ui = useAdminUiStore();
  return (
    <div className="rounded-2xl bg-[var(--theme-surface)] p-3 shadow-sm grid gap-2 md:grid-cols-4">
      <input
        value={ui.q}
        onChange={(e: ChangeEvent<HTMLInputElement>): void => ui.set('q', e.target.value)}
        placeholder="Search…"
        className="rounded-xl border border-[var(--theme-border-blue)] bg-transparent p-2 text-sm outline-none"
      />
      <select
        value={ui.status}
        onChange={(e: ChangeEvent<HTMLSelectElement>): void => ui.set('status', e.target.value as any)}
        className="rounded-xl border border-[var(--theme-border-blue)] bg-transparent p-2 text-sm outline-none"
      >
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In‑Progress</option>
        <option value="needs-feedback">Needs Feedback</option>
        <option value="complete">Complete</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <select
        value={ui.assigned}
        onChange={(e: ChangeEvent<HTMLSelectElement>): void => ui.set('assigned', e.target.value as any)}
        className="rounded-xl border border-[var(--theme-border-blue)] bg-transparent p-2 text-sm outline-none"
      >
        <option value="any">Assigned: Anyone</option>
        <option value="me">Assigned: Me</option>
      </select>
      <select
        value={ui.updatedWithin}
        onChange={(e: ChangeEvent<HTMLSelectElement>): void => ui.set('updatedWithin', e.target.value as any)}
        className="rounded-xl border border-[var(--theme-border-blue)] bg-transparent p-2 text-sm outline-none"
      >
        <option value="24h">Updated: 24h</option>
        <option value="7d">Updated: 7d</option>
        <option value="30d">Updated: 30d</option>
        <option value="all">Updated: All</option>
      </select>
    </div>
  );
}
