import React from 'react';
import { useAdminUiStore } from '../../store/useAdminUiStore';
import AdminPagerView from '../../jsx/admin/adminPagerView';

export default function AdminPager(
  { total }: Readonly<{ total: number }>
): React.ReactElement {
  const { page, pageSize, setPage, setPageSize } = useAdminUiStore();

  const safePageSize: number = Math.max(1, Number(pageSize) || 20);
  const pageCount: number = Math.max(1, Math.ceil(total / safePageSize));
  const canPrev: boolean = page > 1;
  const canNext: boolean = page < pageCount;

  return (
    <AdminPagerView
      page={page}
      pageCount={pageCount}
      canPrev={canPrev}
      canNext={canNext}
      safePageSize={safePageSize}
      onPrev={(): void => {
        if (canPrev) setPage(page - 1);
      }}
      onNext={(): void => {
        if (canNext) setPage(page + 1);
      }}
      onPageSizeChange={(next: number): void => {
        setPage(1);
        setPageSize(next);
      }}
    />
  );
}
