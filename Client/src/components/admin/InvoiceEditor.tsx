import React, { useMemo, useRef, useState } from 'react';
import type { InvoiceItem } from '../../types/invoice.types';
import { money, computeTotals } from '../../helpers/money.helper';

interface Props {
  orderId: number;
  initialItems?: InvoiceItem[];
  initialTaxRate?: number;
  initialDiscountCents?: number;
  initialShippingCents?: number;
}

export default function InvoiceEditor({
                                        orderId,
                                        initialItems = [],
                                        initialTaxRate = 0,
                                        initialDiscountCents = 0,
                                        initialShippingCents = 0,
                                      }: Readonly<Props>): React.ReactElement {
  const [items, setItems] = useState<InvoiceItem[]>(initialItems);
  const [taxRate, setTaxRate] = useState<number>(Number(initialTaxRate) || 0);
  const [discountCents, setDiscountCents] = useState<number>(Number(initialDiscountCents) || 0);
  const [shippingCents, setShippingCents] = useState<number>(Number(initialShippingCents) || 0);
  const [saving, setSaving] = useState(false);

  const hoursRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(
    () => computeTotals(items, { taxRate, discountCents, shippingCents }),
    [items, taxRate, discountCents, shippingCents]
  );

  function addBlankItem(): void {
    setItems(prev => [...prev, { description: '', quantity: 1, unitPriceCents: 0 }]);
  }

  function addTimeEntry(hours: number, rateDollars: number, note?: string): void {
    const qty = Math.max(0, Number(hours) || 0);
    const rateCents = Math.round((Number(rateDollars) || 0) * 100);
    const desc = note?.trim() ? `Time: ${note}` : 'Time';
    setItems(prev => [
      ...prev,
      {
        description: `${desc} (${qty}h @ $${Number(rateDollars || 0).toFixed(2)}/h)`,
        quantity: qty,
        unitPriceCents: rateCents,
      },
    ]);
  }

  function updateItem(idx: number, patch: Partial<InvoiceItem>): void {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number): void {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function saveInvoice(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch(`/api/order/${orderId}/invoice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, taxRate, discountCents, shippingCents }),
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input
          ref={hoursRef}
          type="number"
          min={0}
          step="0.25"
          placeholder="Hours"
          className="rounded-2xl px-3 py-2 bg-[var(--theme-surface)] border"
          aria-label="Hours"
        />
        <input
          ref={rateRef}
          type="number"
          min={0}
          step="5"
          placeholder="Rate (USD/hr)"
          className="rounded-2xl px-3 py-2 bg-[var(--theme-surface)] border"
          aria-label="Rate in USD per hour"
        />
        <input
          ref={noteRef}
          type="text"
          placeholder="Note"
          className="rounded-2xl px-3 py-2 bg-[var(--theme-surface)] border"
          aria-label="Time entry note"
        />
        <button
          type="button"
          className="rounded-2xl px-4 py-2 bg-emerald-600 text-white"
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

      <div className="space-y-2 sm:space-y-3">
        <div className="sm:hidden space-y-2">
          {items.map((it, i) => {
            const amount = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
            return (
              <div
                key={i}
                className="rounded-xl border bg-[var(--theme-bg)]/60 p-2.5 space-y-2"
              >
                <input
                  value={it.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  className="w-full rounded-xl px-2 py-2 bg-[var(--theme-surface)] border"
                  placeholder="Description"
                  aria-label={`Item ${i + 1} description`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs opacity-70">Qty</span>
                    <input
                      type="number"
                      min={0}
                      step="5"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                      className="w-full rounded-xl px-2 py-2 bg-[var(--theme-surface)] border text-right"
                      aria-label={`Item ${i + 1} quantity`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs opacity-70">Unit (USD)</span>
                    <input
                      type="number"
                      min={0}
                      step="5"
                      value={(Number(it.unitPriceCents) || 0) / 100}
                      onChange={(e) => {
                        const dollars = Number(e.target.value) || 0;
                        updateItem(i, { unitPriceCents: Math.round(dollars * 100) });
                      }}
                      className="w-full rounded-xl px-2 py-2 bg-[var(--theme-surface)] border text-right"
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
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white"
                    aria-label={`Remove item ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:block overflow-auto">
          <table className="w-full text-sm">
            <thead>
            <tr className="text-left border-b">
              <th className="py-2 w-24">Qty</th>
              <th className="py-2 w-36">Unit</th>
              <th className="py-2 w-36">Amount</th>
              <th className="py-2 w-14"></th>
            </tr>
            </thead>
            <tbody>
            {items.map((it, i) => {
              const amount = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
              return (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-2">
                    <input
                      value={it.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      className="w-full rounded-xl px-2 py-1.5 bg-[var(--theme-surface)] border"
                      placeholder="Description"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.25"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                      className="w-full rounded-xl px-2 py-1.5 bg-[var(--theme-surface)] border text-right"
                    />
                  </td>
                  <td className="py-2">
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
                        className="w-full rounded-xl px-2 py-1.5 bg-[var(--theme-surface)] border text-right"
                      />
                    </div>
                  </td>
                  <td className="py-2">{money(amount)}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="px-2 py-1 rounded-xl bg-red-600 text-white"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>

          <div className="mt-3">
            <button
              type="button"
              onClick={addBlankItem}
              className="rounded-2xl px-4 py-2 bg-blue-600 text-white"
            >
              + Add Line
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Tax Rate</span>
          <input
            type="number"
            step=".0001"
            min={0}
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
            className="rounded-2xl px-3 py-2 bg-[var(--theme-surface)] border"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Discount (USD)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={(discountCents || 0) / 100}
            onChange={(e) => setDiscountCents(Math.round((Number(e.target.value) || 0) * 100))}
            className="rounded-2xl px-3 py-2 bg-[var(--theme-surface)] border"
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
            className="rounded-2xl px-3 py-2 bg-[var(--theme-surface)] border"
          />
        </label>
      </div>

      <div className="flex flex-col sm:items-end gap-1">
        <div>Subtotal: <strong>{money(totals.subtotal)}</strong></div>
        {totals.discount ? <div>Discount: <strong>-{money(totals.discount)}</strong></div> : null}
        {totals.tax ? <div>Tax: <strong>{money(totals.tax)}</strong></div> : null}
        {totals.shipping ? <div>Shipping: <strong>{money(totals.shipping)}</strong></div> : null}
        <div className="text-base sm:text-lg">Total: <strong>{money(totals.total)}</strong></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={saveInvoice}
          className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-[var(--theme-button)] hover:bg-[var(--theme-hover)]
                       text-[var(--theme-text-white)] cursor-pointer
                       transition-all duration-150 focus:outline-none
                       focus:ring-2 focus:ring-[var(--theme-focus)]/30"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          className="w-full sm:w-auto rounded-2xl px-4 py-2 bg-emerald-600 text-white"
        >
          Generate PDF
        </button>
      </div>
    </section>
  );
}
