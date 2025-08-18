import React, { useEffect } from 'react';
import {type NavigateFunction, useNavigate} from 'react-router-dom';
import AdminFilters from '../../components/admin/AdminFilters';
import AdminOrdersTable from '../../components/admin/AdminOrdersTable';
import { useAdminStore } from '../../store/useAdminStore';
import { useAdminUiStore } from '../../store/useAdminUiStore';
import AdminPager from "../../components/admin/AdminPager";
import type {AdminUiState} from "../../types/dto.types.ts";

export default function AdminOrdersPage(): React.ReactElement {
  const nav: NavigateFunction = useNavigate();
  const { rows, total, loading, fetchList } = useAdminStore();
  const ui: AdminUiState = useAdminUiStore();

  useEffect((): void => {
    void (async (): Promise<void> => {
      try {
        await fetchList({
          q: ui.q,
          status: ui.status,
          assigned: ui.assigned,
          updatedWithin: ui.updatedWithin,
          page: ui.page,
          pageSize: ui.pageSize,
        });
      } catch (err) {
        console.error('AdminOrdersPage: fetchList failed', err);
      }
    })();

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
        onRowClick={(id: number): void | Promise<void> => nav(`/admin/orders/${id}`)}
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
