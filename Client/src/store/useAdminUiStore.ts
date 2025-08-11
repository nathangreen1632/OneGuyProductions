import { create } from 'zustand';
import type { OrderStatus } from '../types/order.types';

interface AdminUiState {
  q: string;
  status: OrderStatus | 'all';
  assigned: 'me' | 'any';
  updatedWithin: '24h' | '7d' | '30d' | 'all';
  page: number;
  pageSize: number;
  polling: boolean;

  set: <K extends keyof AdminUiState>(k: K, v: AdminUiState[K]) => void;
  reset: () => void;

  // NEW: explicit pagination setters
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  q: '',
  status: 'all',
  assigned: 'any',
  updatedWithin: '7d',
  page: 1,
  pageSize: 20,
  polling: true,

  set: (k, v) => set({ [k]: v } as Partial<AdminUiState>),

  // Reset to the same defaults used above
  reset: () =>
    set({
      q: '',
      status: 'all',
      assigned: 'any',
      updatedWithin: '7d',
      page: 1,
      pageSize: 20,
      polling: true,
    }),

  setPage: (page: number) => set({ page }),
  setPageSize: (size: number) => set({ pageSize: size }),
}));
