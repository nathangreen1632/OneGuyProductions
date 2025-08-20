import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { OrderStatus } from '../types/order.types';

const LOG_PREFIX = 'useAdminUiStore';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE = 1;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 200;

type AssignedFilter = 'me' | 'any';
type UpdatedWithin = '24h' | '7d' | '30d' | 'all';

interface AdminUiState {
  q: string;
  status: OrderStatus | 'all';
  assigned: AssignedFilter;
  updatedWithin: UpdatedWithin;
  page: number;
  pageSize: number;
  polling: boolean;

  set: <K extends keyof AdminUiState>(k: K, v: AdminUiState[K]) => void;
  reset: () => void;

  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function normalizePage(v: unknown): number {
  return clamp(Number(v), MIN_PAGE, Number.MAX_SAFE_INTEGER);
}

function normalizePageSize(v: unknown): number {
  return clamp(Number(v), MIN_PAGE_SIZE, MAX_PAGE_SIZE);
}

const MAX_Q_LEN = 200;

function normalizeQuery(v: unknown): string {
  try {
    let s: string = '';

    if (typeof v === 'string') s = v;
    else if (typeof v === 'number' || typeof v === 'boolean') s = String(v);
    else if (v instanceof Date && Number.isFinite(v.getTime())) s = v.toISOString();

    s = s.trim().replace(/\s+/g, ' ');

    if (s.length > MAX_Q_LEN) {
      console.warn('useAdminUiStore: query truncated to 200 chars');
      return s.slice(0, MAX_Q_LEN);
    }
    return s;
  } catch {
    return '';
  }
}


function isOrderStatusOrAll(v: unknown): v is AdminUiState['status'] {
  return v === 'all' ||
    v === 'pending' ||
    v === 'in-progress' ||
    v === 'needs-feedback' ||
    v === 'complete' ||
    v === 'cancelled';
}

function isAssigned(v: unknown): v is AssignedFilter {
  return v === 'me' || v === 'any';
}

function isUpdatedWithin(v: unknown): v is UpdatedWithin {
  return v === '24h' || v === '7d' || v === '30d' || v === 'all';
}

function safeSet<T extends object>(
  set: (partial: Partial<T>) => void,
  partial: Partial<T>
): void {
  try {
    set(partial);
  } catch (err) {
    console.error(`${LOG_PREFIX}: set() failed`, err, { partial });
  }
}

export const useAdminUiStore: UseBoundStore<StoreApi<AdminUiState>> =
  create<AdminUiState>((set) => ({
    q: '',
    status: 'all',
    assigned: 'any',
    updatedWithin: '7d',
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    polling: true,

    set: (k, v): void => {
      try {
        switch (k) {
          case 'q':
            safeSet<AdminUiState>(set, { q: normalizeQuery(v) });
            break;

          case 'status':
            safeSet<AdminUiState>(set, { status: isOrderStatusOrAll(v) ? v : 'all' });
            break;

          case 'assigned':
            safeSet<AdminUiState>(set, { assigned: isAssigned(v) ? v : 'any' });
            break;

          case 'updatedWithin':
            safeSet<AdminUiState>(set, { updatedWithin: isUpdatedWithin(v) ? v : '7d' });
            break;

          case 'page':
            safeSet<AdminUiState>(set, { page: normalizePage(v) });
            break;

          case 'pageSize':
            safeSet<AdminUiState>(set, { pageSize: normalizePageSize(v) });
            break;

          case 'polling':
            safeSet<AdminUiState>(set, { polling: Boolean(v) });
            break;

          default:
            console.warn(`${LOG_PREFIX}: attempted to set unknown key`, k);
        }
      } catch (err) {
        console.error(`${LOG_PREFIX}: set(${String(k)}) threw`, err, { value: v });
      }
    },

    reset: (): void =>
      safeSet<AdminUiState>(set, {
        q: '',
        status: 'all',
        assigned: 'any',
        updatedWithin: '7d',
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        polling: true,
      }),

    setPage: (page: number): void => {
      try {
        safeSet<AdminUiState>(set, { page: normalizePage(page) });
      } catch (err) {
        console.error(`${LOG_PREFIX}: setPage threw`, err, { page });
      }
    },

    setPageSize: (size: number): void => {
      try {
        safeSet<AdminUiState>(set, { pageSize: normalizePageSize(size) });
      } catch (err) {
        console.error(`${LOG_PREFIX}: setPageSize threw`, err, { size });
      }
    },
  }));
