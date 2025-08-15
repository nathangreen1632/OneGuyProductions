import { create } from 'zustand';

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

export const useNotificationStore = create<State & Actions>((set, get) => ({
  items: [],

  set: (items: Notification[]): void => set({ items }),
  add: (n:Notification): void => set({ items: [n, ...get().items] }),
  markRead: (id: string): void =>
    set({ items: get().items.map(n => n.id === id ? { ...n, read: true } : n) }),
  markAllReadForOrder: (orderId: number): void =>
    set({ items: get().items.map(n => n.orderId === orderId ? { ...n, read: true } : n) }),
  hasUnreadForOrder: (orderId: number): boolean =>
    get().items.some(n => !n.read && n.orderId === orderId),
  unreadCount: (): number => get().items.filter(n => !n.read).length,
  clearRead: (): void => set({ items: get().items.filter(n => !n.read) }),
}));