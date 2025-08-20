import React, {useEffect, useMemo} from 'react';
import toast from 'react-hot-toast';
import {useAdminUiStore} from '../../store/useAdminUi.store';
import AdminPagerView from '../../jsx/admin/adminPagerView';
import type {AdminUiState} from "../../types/dto.types";

interface AdminPagerProps {
  total: number;
}

function toPositiveInt(n: unknown, fallback: number): number {
  const v: number = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.floor(v);
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export default function AdminPager(
  { total }: Readonly<AdminPagerProps>
): React.ReactElement {
  const store: AdminUiState = useAdminUiStore();

  useEffect((): void => {
    if (typeof store?.setPage !== 'function') {
      console.error('AdminPager: setPage is not a function.');
      toast.error('AdminPager: internal error (setPage unavailable)');
    }
    if (typeof store?.setPageSize !== 'function') {
      console.error('AdminPager: setPageSize is not a function.');
      toast.error('AdminPager: internal error (setPageSize unavailable)');
    }
  }, [store?.setPage, store?.setPageSize]);

  const safeTotal: number = useMemo((): number => {
    if (!Number.isFinite(total) || total < 0) {
      console.warn('AdminPager: invalid total received:', total);
      toast.error('AdminPager: invalid total count; defaulting to 0');
      return 0;
    }
    return Math.floor(total);
  }, [total]);

  const rawPage: number = Number(store?.page);
  const rawPageSize: number = Number(store?.pageSize);

  const safePageSize: number = useMemo((): number => {
    const size: number = toPositiveInt(rawPageSize, 20);
    if (size !== rawPageSize) {
      console.warn('AdminPager: pageSize was invalid; using', size);
    }
    return size;
  }, [rawPageSize]);

  const pageCount: number = useMemo((): number => {
    try {
      return Math.max(1, Math.ceil(safeTotal / Math.max(1, safePageSize)));
    } catch (err) {
      console.error('AdminPager: failed to compute pageCount.', err);
      toast.error('AdminPager: failed to compute page count');
      return 1;
    }
  }, [safeTotal, safePageSize]);

  const safePage: number = useMemo((): number => {
    const page: number = toPositiveInt(rawPage, 1);
    const clamped: number = clamp(page, 1, pageCount);
    if (page !== clamped) {
      console.warn(`AdminPager: page out of range (${page}); clamped to ${clamped}`);
    }
    return clamped;
  }, [rawPage, pageCount]);

  const canPrev: boolean = safePage > 1;
  const canNext: boolean = safePage < pageCount;

  const onPrev: () => void = (): void => {
    try {
      if (!canPrev) {
        console.warn('AdminPager: previous requested on first page.');
        toast.error('Already on the first page');
        return;
      }
      if (typeof store?.setPage !== 'function') {
        console.error('AdminPager: setPage unavailable on prev.');
        toast.error('AdminPager: cannot change page (internal)');
        return;
      }
      store.setPage(safePage - 1);
    } catch (err) {
      console.error('AdminPager: unexpected error on prev.', err);
      toast.error('Failed to go to previous page');
    }
  };

  const onNext: () => void = (): void => {
    try {
      if (!canNext) {
        console.warn('AdminPager: next requested on last page.');
        toast.error('Already on the last page');
        return;
      }
      if (typeof store?.setPage !== 'function') {
        console.error('AdminPager: setPage unavailable on next.');
        toast.error('AdminPager: cannot change page (internal)');
        return;
      }
      store.setPage(safePage + 1);
    } catch (err) {
      console.error('AdminPager: unexpected error on next.', err);
      toast.error('Failed to go to next page');
    }
  };

  const onPageSizeChange: (next: number) => void = (next: number): void => {
    try {
      if (typeof store?.setPage !== 'function' || typeof store?.setPageSize !== 'function') {
        console.error('AdminPager: setters unavailable for page size change.');
        toast.error('AdminPager: cannot change page size (internal)');
        return;
      }

      const nextSize: number = toPositiveInt(next, safePageSize);
      if (nextSize <= 0) {
        console.warn('AdminPager: invalid page size provided:', next);
        toast.error('Page size must be a positive number');
        return;
      }

      store.setPage(1);
      store.setPageSize(nextSize);
    } catch (err) {
      console.error('AdminPager: unexpected error on page size change.', err);
      toast.error('Failed to change page size');
    }
  };

  return (
    <AdminPagerView
      page={safePage}
      pageCount={pageCount}
      canPrev={canPrev}
      canNext={canNext}
      safePageSize={safePageSize}
      onPrev={onPrev}
      onNext={onNext}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
