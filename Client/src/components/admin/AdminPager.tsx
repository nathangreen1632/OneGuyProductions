import React from 'react';
import { useAdminUiStore } from '../../store/useAdminUiStore';

export default function AdminPager(
  { total }: Readonly<{ total: number }>
): React.ReactElement {
  const { page, pageSize, setPage, setPageSize } = useAdminUiStore();

  const safePageSize: number = Math.max(1, Number(pageSize) || 20);
  const pageCount: number = Math.max(1, Math.ceil(total / safePageSize));
  const canPrev: boolean = page > 1;
  const canNext: boolean = page < pageCount;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          className={`rounded-2xl px-3 py-1 ${
            canPrev ? 'text-[var(--theme-text)] bg-black/5 hover:bg-black/10' : 'text-[var(--theme-text)] bg-black/5 opacity-50 cursor-not-allowed'
          }`}
          onClick={(): void => { if (canPrev) setPage(page - 1); }}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          Prev
        </button>

        <span className="text-[var(--theme-text)] outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30" aria-label="Page count" aria-current="page">
          Page {page} of {pageCount}
        </span>

        <button
          type="button"
          className={`rounded-2xl px-3 py-1 ${
            canNext ? 'text-[var(--theme-text)] bg-black/5 hover:bg-black/10' : 'text-[var(--theme-text)] bg-black/5 opacity-50 cursor-not-allowed'
          }`}
          onClick={(): void => { if (canNext) setPage(page + 1); }}
          disabled={!canNext}
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      <label className="inline-flex items-center gap-2">
        <span className="text-[var(--theme-text)] aria-lable=Rows per page">Rows per page:</span>
        <select
          className="rounded-md bg-black/5 px-2 py-1 text-sm text-[var(--theme-text)] outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
          value={safePageSize}
          onChange={(e): void => {
            const next: number = Number(e.target.value) || 20;
            // reset to page 1 when changing page size to avoid empty pages
            setPage(1);
            setPageSize(next);
          }}
          aria-label="Rows per page"
        >
          {[10, 20, 30, 50, 100].map((n: number) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
