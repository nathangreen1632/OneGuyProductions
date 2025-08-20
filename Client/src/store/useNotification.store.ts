import {create, type StoreApi, type UseBoundStore} from 'zustand';
import { safeSet, safeGet } from '../helpers/zustandSafe.helper';

export type Notification = {
  id: string;
  orderId: number;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type State = { items: Notification[] };
type Actions = {
  set: (items: Notification[]) => void;
  add: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllReadForOrder: (orderId: number) => void;
  hasUnreadForOrder: (orderId: number) => boolean;
  unreadCount: () => number;
  clearRead: () => void;
};

const LOG_PREFIX = 'useNotificationStore';

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function normalizeNotification(n: unknown): Notification | null {
  try {
    const x = (n ?? {}) as Record<string, unknown>;

    let id: string = '';
    if (typeof x.id === 'string') {
      id = x.id;
    } else if (typeof x.id === 'number') {
      id = String(x.id);
    }

    const orderIdNum: number = Number(x.orderId);
    const orderId: number = Number.isFinite(orderIdNum) && orderIdNum > 0 ? orderIdNum : 0;

    const title: string = isString(x.title) ? x.title : '';
    const message: string = isString(x.message) ? x.message : '';
    const createdAt: string = isString(x.createdAt) ? x.createdAt : new Date().toISOString();
    const read: boolean = Boolean(x.read);

    if (!id || orderId <= 0) return null;
    return { id, orderId, title, message, createdAt, read };
  } catch (err) {
    console.error(`${LOG_PREFIX}: normalizeNotification failed`, err, { n });
    return null;
  }
}

function normalizeArray(arr: unknown): Notification[] {
  if (!Array.isArray(arr)) return [];
  const out: Notification[] = [];
  for (const item of arr) {
    const n: Notification | null = normalizeNotification(item);
    if (n) out.push(n);
  }
  return out;
}

export const useNotificationStore: UseBoundStore<StoreApi<State & Actions>> =
  create<State & Actions>(
    (
      set: StoreApi<State & Actions>['setState'],
      get: StoreApi<State & Actions>['getState']
    ) => ({
      items: [] as Notification[],

  set: (items: Notification[]): void => {
    try {
      const normalized: Notification[] = normalizeArray(items);
      safeSet<State>(set, { items: normalized }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: set(items) threw`, err, { items });
    }
  },

  add: (n: Notification): void => {
    try {
      const nn: Notification | null = normalizeNotification(n);
      if (!nn) return;
      const current: Notification[] = safeGet<State, Notification[]>(
        get,
        (s: State): Notification[] => s.items,
        [],
        LOG_PREFIX
      );

      const filtered: Notification[] = current.filter((x: Notification): boolean => x.id !== nn.id);
      safeSet<State>(set, { items: [nn, ...filtered] }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: add() threw`, err, { n });
    }
  },

  markRead: (id: string): void => {
    try {
      if (!isString(id) || !id) return;
      const current: Notification[] = safeGet<State, Notification[]>(get, (s: State): Notification[] => s.items, [], LOG_PREFIX);
      const next: Notification[] = current.map((n: Notification): Notification => (n.id === id ? { ...n, read: true } : n));
      safeSet<State>(set, { items: next }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: markRead() threw`, err, { id });
    }
  },

  markAllReadForOrder: (orderId: number): void => {
    try {
      const idNum: number = Number(orderId);
      if (!Number.isFinite(idNum) || idNum <= 0) return;
      const current: Notification[] = safeGet<State, Notification[]>(get, (s: State): Notification[] => s.items, [], LOG_PREFIX);
      const next: Notification[] = current.map((n: Notification): Notification => (n.orderId === idNum ? { ...n, read: true } : n));
      safeSet<State>(set, { items: next }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: markAllReadForOrder() threw`, err, { orderId });
    }
  },

  hasUnreadForOrder: (orderId: number): boolean => {
    try {
      const idNum: number = Number(orderId);
      if (!Number.isFinite(idNum) || idNum <= 0) return false;
      const items: Notification[] = safeGet<State, Notification[]>(get, (s: State): Notification[] => s.items, [], LOG_PREFIX);
      return items.some((n: Notification): boolean => !n.read && n.orderId === idNum);
    } catch (err) {
      console.error(`${LOG_PREFIX}: hasUnreadForOrder() threw`, err, { orderId });
      return false;
    }
  },

  unreadCount: (): number => {
    try {
      const items: Notification[] = safeGet<State, Notification[]>(get, (s: State): Notification[] => s.items, [], LOG_PREFIX);
      let count: number = 0;
      for (const n of items) if (!n.read) count += 1;
      return count;
    } catch (err) {
      console.error(`${LOG_PREFIX}: unreadCount() threw`, err);
      return 0;
    }
  },

  clearRead: (): void => {
    try {
      const items: Notification[] = safeGet<State, Notification[]>(get, (s: State): Notification[] => s.items, [], LOG_PREFIX);
      const next: Notification[] = items.filter((n: Notification): boolean => !n.read);
      safeSet<State>(set, { items: next }, LOG_PREFIX);
    } catch (err) {
      console.error(`${LOG_PREFIX}: clearRead() threw`, err);
    }
  },
}));
