import React, { type ReactElement } from 'react';
import type { OrderUpdateDto } from '../../types/order.types.ts';
import { linkifySafe } from '../../helpers/linkify.ts';

export default function AdminTimeline(
  { updates }: Readonly<{ updates: OrderUpdateDto[] }>
): React.ReactElement {
  if (!updates?.length) {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
        No updates yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {updates.map((u: OrderUpdateDto): ReactElement => (
        <li
          key={u.id}
          className="
            rounded-2xl
            bg-[var(--theme-surface)]
            shadow-[0_4px_14px_0_var(--theme-shadow)]
            overflow-hidden
          "
        >
          {/* accent bar */}
          <div className="h-0.5 w-full bg-[var(--theme-border-red)]" />

          <div className="p-3 sm:p-4 text-[var(--theme-text)]">
            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">{u.authorName}</span>
                <span className="rounded-full border px-2 py-0.5 uppercase tracking-wide
                                  border-[var(--theme-border-red)] text-[10px]">
                  {u.source}
                </span>
              </div>
              <span className="text-[var(--theme-text)]/70">
                {new Date(u.createdAt).toLocaleString()}
              </span>
            </div>

            {/* body */}
            <div
              className="mt-3 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2
                         [&_a]:text-[var(--theme-accent)] hover:[&_a]:opacity-80"
              dangerouslySetInnerHTML={{ __html: linkifySafe(u.body) }}
            />

            {/* flags */}
            {u.requiresResponse && (
              <div className="mt-3 inline-flex items-center gap-2">
                <span className="rounded-full bg-[var(--theme-button-red)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--theme-text-white)]">
                  Requires customer response
                </span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
