import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import AdminFilters from '../../components/admin/AdminFilters';
import AdminOrdersTable from '../../components/admin/AdminOrdersTable';
import { useAdminStore } from '../../store/useAdmin.store';
import { useAdminUiStore } from '../../store/useAdminUi.store';
import AdminPager from '../../components/admin/AdminPager';
import type { AdminUiState } from '../../types/dto.types';

const LOG_PREFIX = 'AdminOrdersPage';

function offlineHint(): string {
  try {
    return typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator).onLine === false
      ? ' You appear to be offline.'
      : '';
  } catch {
    return '';
  }
}

function safeNavigate(nav: NavigateFunction, to: string | number): void {
  try {
    nav(to as any);
  } catch (err) {
    console.error(`${LOG_PREFIX}: navigation failed`, err);
    toast('Navigation failed. Please try again or use your browser back button.', { icon: 'ℹ️' });
  }
}

export default function AdminOrdersPage(): React.ReactElement {
  const nav: NavigateFunction = useNavigate();
  const { rows, total, loading, fetchList } = useAdminStore();
  const ui: AdminUiState = useAdminUiStore();

  useEffect((): () => void => {
    let active: boolean = true;

    (async (): Promise<void> => {
      try {
        await fetchList({
          q: ui?.q ?? '',
          status: ui?.status ?? undefined,
          assigned: ui?.assigned ?? undefined,
          updatedWithin: ui?.updatedWithin ?? undefined,
          page: ui?.page ?? 1,
          pageSize: ui?.pageSize ?? 20,
        });
      } catch (err) {
        console.error(`${LOG_PREFIX}: fetchList failed`, err);
        if (active) toast.error(`Unable to load orders.${offlineHint()}`);
      }
    })();

    return (): void => {
      active = false;
    };
  }, [ui.q, ui.status, ui.assigned, ui.updatedWithin, ui.page, ui.pageSize, fetchList]);


  return (
    <div className="space-y-4">
      <AdminFilters />

      <AdminOrdersTable
        rows={rows}
        loading={loading}
        total={total}
        page={ui.page}
        pageSize={ui.pageSize}
        onRowClick={(id: number): void => safeNavigate(nav, `/admin/orders/${id}`)}
      />

      <div className="hidden md:block rounded-2xl bg-[var(--theme-surface)] p-3 shadow-sm">
        <AdminPager total={total} />
      </div>
      <div className="md:hidden">
        <AdminPager total={total} />
      </div>
    </div>
  );
}
