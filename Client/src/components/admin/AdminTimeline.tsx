import { type ReactElement, memo, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { OrderUpdateDto} from '../../types/order.types';
import type { TLegacyAuthorFieldsType, TAuthorNestedType } from '../../types/admin.types';
import AdminTimelineView from '../../jsx/admin/adminTimelineView';



export type TOrderUpdateLikeType = OrderUpdateDto & Partial<TLegacyAuthorFieldsType>;

type TAdminTimelinePropsType = Readonly<{
  updates: ReadonlyArray<OrderUpdateDto>;
}>;

function displayLabel(update: TOrderUpdateLikeType): string {
  try {
    const author: TAuthorNestedType = update?.author ?? {};
    const role: string | undefined = author.role ?? update?.authorRole;
    const first: string | undefined = author.firstName ?? update?.authorFirstName;
    const username: string | undefined = author.username ?? update?.authorUsername;

    const rawEmail: string | undefined =
      author.email ??
      update?.authorEmail ??
      (update?.authorName.includes('@') ? update.authorName : undefined);

    const providedName: string | undefined = update?.authorName ?? undefined;

    if (role === 'admin') {
      return first || username || 'Admin';
    }

    const aliasFromEmail: string | undefined = rawEmail ? String(rawEmail).split('@')[0] : undefined;
    const candidate: string = first || username || providedName || aliasFromEmail || 'User';

    return candidate.includes('@') ? candidate.split('@')[0] : candidate;
  } catch (err) {
    console.error('AdminTimeline: displayLabel failed for update', update, err);
    toast.error('AdminTimeline: failed to compute author label');
    return 'User';
  }
}

function formatDateSafe(input: unknown): string {
  try {
    const d = new Date(String(input));
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
  } catch (err) {
    console.error('AdminTimeline: formatDateSafe error', err);
    toast.error('AdminTimeline: failed to format date');
    return '';
  }
}

function AdminTimelineComponent({ updates }: TAdminTimelinePropsType): ReactElement {
  useEffect(() => {
    if (!Array.isArray(updates)) {
      console.warn('AdminTimeline: updates prop is not an array', updates);
      toast.error('AdminTimeline: invalid updates list');
    }
  }, [updates]);

  const safeUpdates: ReadonlyArray<OrderUpdateDto> = Array.isArray(updates) ? updates : [];

  const onDisplayLabel: (u: OrderUpdateDto) => string = (u: OrderUpdateDto): string =>
    displayLabel(u as TOrderUpdateLikeType);

  return (
    <AdminTimelineView
      updates={safeUpdates}
      displayLabel={onDisplayLabel}
      formatDateSafe={formatDateSafe}
    />
  );
}

export default memo(AdminTimelineComponent);
