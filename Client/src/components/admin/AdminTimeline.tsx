import { type ReactElement, memo } from 'react';
import type { OrderUpdateDto } from '../../types/order.types';
import { linkifySafe } from '../../helpers/linkify';

type TAuthorNestedType = {
  role?: string;
  firstName?: string;
  username?: string;
  email?: string;
};

type TLegacyAuthorFieldsType = {
  author?: TAuthorNestedType;
  authorRole?: string;
  authorFirstName?: string;
  authorUsername?: string;
  authorEmail?: string;
  authorName?: string;
};

type TOrderUpdateLikeType = OrderUpdateDto & Partial<TLegacyAuthorFieldsType>;

type TAdminTimelinePropsType = Readonly<{
  updates: ReadonlyArray<OrderUpdateDto>;
}>;

function displayLabel(update: TOrderUpdateLikeType): string {
  const author: TAuthorNestedType = update.author ?? {};
  const role: string | undefined = author.role ?? update.authorRole;
  const first: string | undefined = author.firstName ?? update.authorFirstName;
  const username: string | undefined = author.username ?? update.authorUsername;

  const rawEmail: string | undefined =
    author.email ??
    update.authorEmail ??
    (update.authorName?.includes('@')
      ? update.authorName
      : undefined);

  const providedName: string | undefined = update.authorName;

  if (role === 'admin') {
    return first || username || 'Admin';
  }

  const aliasFromEmail: string | undefined = rawEmail ? rawEmail.split('@')[0] : undefined;
  const candidate = first || username || providedName || aliasFromEmail || 'User';

  return candidate?.includes('@') ? candidate.split('@')[0] : candidate;
}

function formatDateSafe(input: unknown): string {
  const d = new Date(String(input));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

function AdminTimelineComponent({ updates }: TAdminTimelinePropsType): ReactElement {
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
          <div className="h-0.5 w-full bg-[var(--theme-border-red)]" />

          <div className="p-3 sm:p-4 text-[var(--theme-text)]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {displayLabel(u as TOrderUpdateLikeType)}
                </span>
                <span
                  className="rounded-full border px-2 py-0.5 uppercase tracking-wide
                             border-[var(--theme-border-red)] text-[10px]"
                >
                  {u.source}
                </span>
              </div>
              <span className="text-[var(--theme-text)]/70">
                {formatDateSafe(u.createdAt)}
              </span>
            </div>

            <div
              className="mt-3 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2
                         [&_a]:text-[var(--theme-accent)] hover:[&_a]:opacity-80"
              dangerouslySetInnerHTML={{ __html: linkifySafe(u.body) }}
            />

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

export default memo(AdminTimelineComponent);
