import React, { type ChangeEvent } from 'react';

interface AdminPagerViewProps {
  page: number;
  pageCount: number;
  canPrev: boolean;
  canNext: boolean;
  safePageSize: number;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (nextSize: number) => void;
}

export default function AdminPagerView({
                                         page,
                                         pageCount,
                                         canPrev,
                                         canNext,
                                         safePageSize,
                                         onPrev,
                                         onNext,
                                         onPageSizeChange,
                                       }: Readonly<AdminPagerViewProps>): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          className={`rounded-2xl px-3 py-1 ${
            canPrev
              ? 'text-[var(--theme-text)] bg-black/5 hover:bg-black/10'
              : 'text-[var(--theme-text)] bg-black/5 opacity-50 cursor-not-allowed'
          }`}
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          Prev
        </button>

        <span
          className="text-[var(--theme-text)] outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
          aria-label="Page count"
          aria-current="page"
        >
          Page {page} of {pageCount}
        </span>

        <button
          type="button"
          className={`rounded-2xl px-3 py-1 ${
            canNext
              ? 'text-[var(--theme-text)] bg-black/5 hover:bg-black/10'
              : 'text-[var(--theme-text)] bg-black/5 opacity-50 cursor-not-allowed'
          }`}
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      <label className="inline-flex items-center gap-2">
        <span className="text-[var(--theme-text)]">Rows per page:</span>
        <select
          className="rounded-md bg-black/5 px-2 py-1 text-sm text-[var(--theme-text)] outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
          value={safePageSize}
          onChange={(e: ChangeEvent<HTMLSelectElement>): void => {
            const next: number = Number(e.target.value) || 20;
            onPageSizeChange(next);
          }}
          aria-label="Rows per page"
        >
          {[10, 20, 30, 50, 100].map((n: number) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
