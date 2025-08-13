import React from 'react';
import { useAdminUiStore } from '../../store/useAdminUiStore';
import type { AdminUiState } from '../../types/dto.types';
import AdminFiltersView from '../../jsx/admin/adminFiltersView';

export default function AdminFilters(): React.ReactElement {
  const ui: AdminUiState = useAdminUiStore();

  return <AdminFiltersView ui={ui} />;
}

