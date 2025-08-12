export interface OrderLite {
  id: number;
  unreadCount?: number;
  isUnread?: boolean;
  [key: string]: any;
}

export async function fetchMyOrdersFull(): Promise<{
  orders: OrderLite[];
  unreadOrderIds: number[];
}> {
  const res: Response = await fetch('/api/order/my-orders?shape=full', { credentials: 'include' });
  if (!res.ok) throw new Error(`orders failed: ${res.status}`);
  const data: any = await res.json();

  const orders: OrderLite[] = Array.isArray(data) ? data : (data?.orders ?? []);
  const unreadOrderIds: number[] = Array.isArray(data?.unreadOrderIds) ? data.unreadOrderIds : [];
  return { orders, unreadOrderIds };
}
