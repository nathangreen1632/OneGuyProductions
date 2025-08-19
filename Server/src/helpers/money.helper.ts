export const money = (cents: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

export function computeTotals(
  items: Array<{ quantity: number; unitPriceCents: number }>,
  opts?: { discountCents?: number; taxRate?: number; shippingCents?: number }
) {
  const discount: number = opts?.discountCents ?? 0;
  const taxRate: number  = opts?.taxRate ?? 0;
  const shipping: number = opts?.shippingCents ?? 0;

  const subtotal: number = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0), 0);
  const tax: number      = Math.round(subtotal * taxRate);
  const total: number    = subtotal - discount + tax + shipping;

  return { subtotal, discount, tax, shipping, total };
}
