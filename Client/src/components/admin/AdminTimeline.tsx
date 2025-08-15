import { type ReactElement, memo } from 'react';
import type { OrderUpdateDto } from '../../types/order.types';
import AdminTimelineView from '../../jsx/admin/adminTimelineView';

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

export type TOrderUpdateLikeType = OrderUpdateDto & Partial<TLegacyAuthorFieldsType>;

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
    (update.authorName?.includes('@') ? update.authorName : undefined);

  const providedName: string | undefined = update.authorName;

  if (role === 'admin') {
    return first || username || 'Admin';
  }

  const aliasFromEmail: string | undefined = rawEmail ? rawEmail.split('@')[0] : undefined;
  const candidate: string = first || username || providedName || aliasFromEmail || 'User';

  return candidate?.includes('@') ? candidate.split('@')[0] : candidate;
}

function formatDateSafe(input: unknown): string {
  const d = new Date(String(input));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

function AdminTimelineComponent({ updates }: TAdminTimelinePropsType): ReactElement {
  return (
    <AdminTimelineView
      updates={updates}
      displayLabel={displayLabel}
      formatDateSafe={formatDateSafe}
    />
  );
}

export default memo(AdminTimelineComponent);
