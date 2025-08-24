// Client/src/components/admin/InvoiceEditor.tsx
import React, { useMemo, useRef, useState } from 'react';
import type { InvoiceItem } from '../../types/invoice.types';
import { money, computeTotals } from '../../helpers/money.helper';
import { X } from 'lucide-react';

interface Props {
  orderId: number;
  initialItems?: InvoiceItem[];
  initialTaxRate?: number;
  initialDiscountCents?: number; // kept for compatibility; we derive an initial percent from it
  initialShippingCents?: number;
}

export default function InvoiceEditor({
                                        orderId,
                                        initialItems = [],
                                        initialTaxRate = 0,
                                        initialDiscountCents = 0,
                                        initialShippingCents = 0,
                                      }: Readonly<Props>): React.ReactElement {
  // ─────────────────────────────────────────────────────────────
  // Shared styles (compact, sleek, aligned to your theme tokens)
  // ─────────────────────────────────────────────────────────────
  const inputBase =
    'w-full rounded-xl px-2 py-1.5 text-sm bg-[var(--theme-surface)] border border-[var(--theme-border)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30';
  const inputRight = `${inputBase} text-right`;
  const btnBase =
    'rounded-lg px-3 py-1.5 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30';
  const btnPrimary = `${btnBase} bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)]`;
  const btnGreen = `${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`;
  const btnBlue = `${btnBase} bg-blue-600 hover:bg-blue-700 text-white`;
  const btnIconRed =
    'inline-flex items-center justify-center rounded-lg p-0.5 text-[var(--theme-button-red)] hover:text-[var(--theme-button-red-hover)] bg-transparent transition-colors';

  // ─────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────
  const [items, setItems] = useState<InvoiceItem[]>(initialItems);
  const [taxRate, setTaxRate] = useState<number>(Number(initialTaxRate) || 0);
  const [shippingCents, setShippingCents] = useState<number>(Number(initialShippingCents) || 0);
  const [saving, setSaving] = useState(false);

  // derive initial discount percent from initialDiscountCents relative to initial items subtotal
  const initialPercent = useMemo(() => {
    const subtotalInit = initialItems.reduce((sum, it) => {
      const q = Math.max(0, Number(it.quantity) || 0);
      const unit = Math.max(0, Number(it.unitPriceCents) || 0);
      return sum + q * unit;
    }, 0);
    if (subtotalInit > 0 && initialDiscountCents > 0) {
      return (initialDiscountCents / subtotalInit) * 100;
    }
    return 0;
  }, [initialItems, initialDiscountCents]);

  const [discountPercent, setDiscountPercent] = useState<number>(initialPercent);

  // Inputs for quick time entry
  const hoursRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  // Current subtotal (in cents) from items
  const subtotalCents = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Math.max(0, Number(it.quantity) || 0);
      const unit = Math.max(0, Number(it.unitPriceCents) || 0);
      return sum + q * unit;
    }, 0);
  }, [items]);

  // Convert percent → cents for computeTotals
  const discountCentsFromPercent = useMemo(() => {
    const pct = Math.max(0, Number(discountPercent) || 0) / 100;
    return Math.round(subtotalCents * pct);
  }, [discountPercent, subtotalCents]);

  const totals = useMemo(
    () =>
      computeTotals(items, {
        taxRate,
        discountCents: discountCentsFromPercent,
        shippingCents,
      }),
    [items, taxRate, discountCentsFromPercent, shippingCents]
  );

  // ─────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────
  function addBlankItem(): void {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPriceCents: 0 }]);
  }

  function addTimeEntry(hours: number, rateDollars: number, note?: string): void {
    const qty = Math.max(0, Number(hours) || 0);
    const rateCents = Math.round((Number(rateDollars) || 0) * 100);
    const desc = note?.trim() ? `Time: ${note}` : 'Time';
    setItems((prev) => [
      ...prev,
      {
        description: `${desc} (${qty}h @ $${Number(rateDollars || 0).toFixed(2)}/h)`,
        quantity: qty,
        unitPriceCents: rateCents,
      },
    ]);
  }

  function updateItem(idx: number, patch: Partial<InvoiceItem>): void {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number): void {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveInvoice(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/order/${orderId}/invoice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // Backend expects cents; we send computed discountCents
        body: JSON.stringify({ items, taxRate, discountCents: discountCentsFromPercent, shippingCents }),
      });
      setSaving(false);
      if (!res.ok) return;
    } catch {
      setSaving(false);
    }
  }

  async function downloadPdf(): Promise<void> {
    await saveInvoice();
    const resp = await fetch(`/api/order/${orderId}/invoice`, { credentials: 'include' });
    if (!resp.ok) return;

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${orderId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────
  return (
    <section
      className="
        rounded-2xl
        bg-[var(--theme-surface)]
        text-[var(--theme-text)]
        shadow-[0_4px_14px_0_var(--theme-shadow)]
        p-3 sm:p-4 space-y-4
      "
      aria-label="Invoice and Quote"
    >
      <header className="space-y-0.5">
        <h3 className="text-lg sm:text-xl font-semibold">Generate Invoice</h3>
      </header>

      {/* Quick Time Entry */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,75px)_minmax(0,75px)_1fr_auto] gap-2">
        <input
          ref={hoursRef}
          type="number"
          min={0}
          step="0.25"
          placeholder="Hours"
          className={inputBase}
          aria-label="Hours"
        />
        <input
          ref={rateRef}
          type="number"
          min={0}
          step="5"
          placeholder="Rate"
          className={inputBase}
          aria-label="Rate in USD per hour"
        />
        <input
          ref={noteRef}
          type="text"
          placeholder="Note"
          className={inputBase}
          aria-label="Time entry note"
        />
        <button
          type="button"
          className={btnBlue}
          onClick={() => {
            const h = Number(hoursRef.current?.value || 0);
            const r = Number(rateRef.current?.value || 0);
            const n = noteRef.current?.value || '';
            addTimeEntry(h, r, n);
          }}
        >
          + Add Time
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2 sm:space-y-3">
        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {items.map((it, i) => {
            const amount = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
            return (
              <div
                key={i}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/60 p-2.5 space-y-2"
              >
                <input
                  value={it.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  className={inputBase}
                  placeholder="Description"
                  aria-label={`Item ${i + 1} description`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs opacity-70">Qty</span>
                    <input
                      type="number"
                      min={0}
                      step="0.25"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                      className={inputRight}
                      aria-label={`Item ${i + 1} quantity`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs opacity-70">Price (USD)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={(Number(it.unitPriceCents) || 0) / 100}
                      onChange={(e) => {
                        const dollars = Number(e.target.value) || 0;
                        updateItem(i, { unitPriceCents: Math.round(dollars * 100) });
                      }}
                      className={inputRight}
                      aria-label={`Item ${i + 1} unit price in USD`}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm opacity-70">Amount</div>
                  <div className="font-medium">{money(amount)}</div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className={btnIconRed}
                    aria-label={`Remove item ${i + 1}`}
                    title="Remove line"
                  >
                    <X size={16} />
                    <span className="sr-only">Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table — align paddings with Generate Invoice: px-2 py-1.5 */}
        <div className="hidden sm:block overflow-auto">
          <table className="w-full text-sm">
            <thead>
            <tr className="text-left border-b border-[var(--theme-border)]">
              <th className="px-2 py-1 min-w-[220px]">Description</th>
              <th className="px-2 py-1 w-[80px]">Qty</th>
              <th className="px-2 py-1 w-[120px]">Price</th>
              <th className="px-2 py-1 w-[120px]">Total</th>
              <th className="px-2 py-1 w-[40px]"></th>
            </tr>
            </thead>
            <tbody>
            {items.map((it, i) => {
              const amount = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
              return (
                <tr key={i} className="border-b border-[var(--theme-border)] last:border-b-0 align-middle">
                  <td className="px-2 py-1">
                    <input
                      value={it.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      className={inputBase}
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-2">
                    <input
                      type="number"
                      min={0}
                      step="0.25"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                      className={inputRight}
                    />
                  </td>
                  <td className="px-2">
                    <div className="flex items-center gap-1">
                      <span className="opacity-70">$</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={(Number(it.unitPriceCents) || 0) / 100}
                        onChange={(e) => {
                          const dollars = Number(e.target.value) || 0;
                          updateItem(i, { unitPriceCents: Math.round(dollars * 100) });
                        }}
                        className={inputRight}
                      />
                    </div>
                  </td>
                  <td className="px-2">{money(amount)}</td>
                  <td className="px-2">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className={btnIconRed}
                      aria-label="Remove line"
                      title="Remove line"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>

          <div className="mt-3">
            <button type="button" onClick={addBlankItem} className={btnBlue}>
              + Add Line
            </button>
          </div>
        </div>
      </div>

      {/* Tax / Discount / Shipping */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Tax Rate</span>
          <input
            type="number"
            step=".0001"
            min={0}
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
            className={inputBase}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Discount (%)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
            className={inputBase}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Shipping (USD)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={(shippingCents || 0) / 100}
            onChange={(e) => setShippingCents(Math.round((Number(e.target.value) || 0) * 100))}
            className={inputBase}
          />
        </label>
      </div>

      {/* Totals */}
      <div className="flex flex-col sm:items-end gap-1">
        <div>
          Subtotal: <strong>{money(totals.subtotal)}</strong>
        </div>
        {totals.discount ? (
          <div>
            Discount: <strong>-{money(totals.discount)}</strong>
          </div>
        ) : null}
        {totals.tax ? (
          <div>
            Tax: <strong>{money(totals.tax)}</strong>
          </div>
        ) : null}
        {totals.shipping ? (
          <div>
            Shipping: <strong>{money(totals.shipping)}</strong>
          </div>
        ) : null}
        <div className="text-base sm:text-lg">
          Total: <strong>{money(totals.total)}</strong>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button type="button" disabled={saving} onClick={saveInvoice} className={btnPrimary}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={downloadPdf} className={btnGreen}>
          Generate PDF
        </button>
      </div>
    </section>
  );
}
