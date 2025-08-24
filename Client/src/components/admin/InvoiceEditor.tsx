import React, {type ChangeEvent, type RefObject, useMemo, useRef, useState} from 'react';
import type { InvoiceItem } from '../../types/invoice.types';
import { money, computeTotals } from '../../helpers/money.helper';
import { X } from 'lucide-react';

type TPropsType = Readonly<{
  orderId: number;
  initialItems?: InvoiceItem[];
  initialTaxRate?: number;
  initialDiscountCents?: number;
  initialShippingCents?: number;
}>;

type TLineItemType = InvoiceItem & { id: string };

type TPlainInvoiceItemType = InvoiceItem;

let __iidCounter: number = 0;

function makeId(): string {
  const c: Crypto | undefined = (globalThis as unknown as { crypto?: Crypto }).crypto;

  if (c?.randomUUID) {
    return c.randomUUID();
  }

  if (c?.getRandomValues) {
    const bytes = new Uint8Array(12);
    c.getRandomValues(bytes);
    let rnd: string = '';
    for (let i: number = 0; i < bytes.length; i += 3) {
      const n: number = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      rnd += n.toString(36).padStart(5, '0');
    }
    return `iid_${Date.now().toString(36)}_${rnd}`;
  }

  __iidCounter = (__iidCounter + 1) >>> 0;
  return `iid_${Date.now().toString(36)}_${__iidCounter.toString(36)}`;
}


export default function InvoiceEditor({
                                        orderId,
                                        initialItems = [],
                                        initialTaxRate = 0,
                                        initialDiscountCents = 0,
                                        initialShippingCents = 0,
                                      }: TPropsType): React.ReactElement {
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

  const seededItems: TLineItemType[] = useMemo(() => {
    return (initialItems ?? []).map((it) => ({
      id: makeId(),
      description: it.description ?? '',
      quantity: Number(it.quantity) || 0,
      unitPriceCents: Number(it.unitPriceCents) || 0,
    }));
  }, [initialItems]);

  const [items, setItems] = useState<TLineItemType[]>(seededItems);
  const [taxRate, setTaxRate] = useState<number>(Number(initialTaxRate) || 0);
  const [shippingCents, setShippingCents] = useState<number>(Number(initialShippingCents) || 0);
  const [saving, setSaving] = useState<boolean>(false);

  const initialPercent: number = useMemo(() => {
    const subtotalInit: number = (initialItems ?? []).reduce((sum: number, it: InvoiceItem): number => {
      const q: number = Math.max(0, Number(it.quantity) || 0);
      const unit: number = Math.max(0, Number(it.unitPriceCents) || 0);
      return sum + q * unit;
    }, 0);
    if (subtotalInit > 0 && initialDiscountCents > 0) {
      return (initialDiscountCents / subtotalInit) * 100;
    }
    return 0;
  }, [initialItems, initialDiscountCents]);

  const [discountPercent, setDiscountPercent] = useState<number>(initialPercent);

  const hoursRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
  const rateRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
  const noteRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);

  const subtotalCents: number = useMemo((): number => {
    return items.reduce((sum: number, it: TLineItemType): number => {
      const q: number = Math.max(0, Number(it.quantity) || 0);
      const unit: number = Math.max(0, Number(it.unitPriceCents) || 0);
      return sum + q * unit;
    }, 0);
  }, [items]);

  const discountCentsFromPercent: number = useMemo((): number => {
    const pct: number = Math.max(0, Number(discountPercent) || 0) / 100;
    return Math.round(subtotalCents * pct);
  }, [discountPercent, subtotalCents]);

  const totals = useMemo(
    () =>
      computeTotals(
        items.map<TPlainInvoiceItemType>(({ description, quantity, unitPriceCents }) => ({
          description,
          quantity,
          unitPriceCents,
        })),
        { taxRate, discountCents: discountCentsFromPercent, shippingCents }
      ),
    [items, taxRate, discountCentsFromPercent, shippingCents]
  );

  function addBlankItem(): void {
    setItems((prev: TLineItemType[]): TLineItemType[] => [
      ...prev,
      { id: makeId(), description: '', quantity: 1, unitPriceCents: 0 },
    ]);
  }

  function addTimeEntry(hours: number, rateDollars: number, note?: string): void {
    const qty: number = Math.max(0, Number(hours) || 0);
    const rateCents: number = Math.round((Number(rateDollars) || 0) * 100);
    const descLabel: string = note?.trim() ? `Time: ${note}` : 'Time';
    setItems((prev: TLineItemType[]): TLineItemType[] => [
      ...prev,
      {
        id: makeId(),
        description: `${descLabel} (${qty}h @ $${Number(rateDollars || 0).toFixed(2)}/h)`,
        quantity: qty,
        unitPriceCents: rateCents,
      },
    ]);
  }

  function updateItemById(id: string, patch: Partial<InvoiceItem>): void {
    setItems((prev: TLineItemType[]): TLineItemType[] =>
      prev.map((it: TLineItemType): TLineItemType => (it.id === id ? { ...it, ...patch } : it))
    );
  }

  function removeItemById(id: string): void {
    setItems((prev: TLineItemType[]): TLineItemType[] => prev.filter((it: TLineItemType): boolean => it.id !== id));
  }

  async function saveInvoice(): Promise<void> {
    setSaving(true);
    try {
      const plainItems: TPlainInvoiceItemType[] = items.map(({ description, quantity, unitPriceCents }) => ({
        description,
        quantity,
        unitPriceCents,
      }));

      const res = await fetch(`/api/order/${orderId}/invoice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: plainItems,
          taxRate,
          discountCents: discountCentsFromPercent,
          shippingCents,
        }),
      });
      setSaving(false);
      if (!res.ok) return;
    } catch {
      setSaving(false);
    }
  }

  async function downloadPdf(): Promise<void> {
    await saveInvoice();
    const resp: Response = await fetch(`/api/order/${orderId}/invoice`, { credentials: 'include' });
    if (!resp.ok) return;

    const blob: Blob = await resp.blob();
    const url: string = URL.createObjectURL(blob);
    const a:  HTMLAnchorElement = document.createElement('a');
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

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,100px)_minmax(0,100px)_1fr_auto] gap-2">
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
          onClick={(): void => {
            const h: number = Number(hoursRef.current?.value || 0);
            const r: number = Number(rateRef.current?.value || 0);
            const n: string = noteRef.current?.value || '';
            addTimeEntry(h, r, n);
          }}
        >
          + Add Time
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="sm:hidden space-y-2">
          {items.map((it: TLineItemType, idx: number): React.ReactElement => {
            const amount: number = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
            return (
              <div
                key={it.id}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/60 p-2.5 space-y-2"
              >
                <input
                  value={it.description}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void => updateItemById(it.id, { description: e.target.value })}
                  className={inputBase}
                  placeholder="Description"
                  aria-label={`Item ${idx + 1} description`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs opacity-70">Qty</span>
                    <input
                      type="number"
                      min={0}
                      step="0.25"
                      value={it.quantity}
                      onChange={(e: ChangeEvent<HTMLInputElement>): void => updateItemById(it.id, { quantity: Number(e.target.value) })}
                      className={inputRight}
                      aria-label={`Item ${idx + 1} quantity`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs opacity-70">Price (USD)</span>
                    <input
                      type="number"
                      min={0}
                      step="5"
                      value={(Number(it.unitPriceCents) || 0) / 100}
                      onChange={(e: ChangeEvent<HTMLInputElement>): void => {
                        const dollars = Number(e.target.value) || 0;
                        updateItemById(it.id, { unitPriceCents: Math.round(dollars * 100) });
                      }}
                      className={inputRight}
                      aria-label={`Item ${idx + 1} unit price in USD`}
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
                    onClick={(): void => removeItemById(it.id)}
                    className={btnIconRed}
                    aria-label={`Remove item ${idx + 1}`}
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
            {items.map((it: TLineItemType): React.ReactElement => {
              const amount: number = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
              return (
                <tr key={it.id} className="border-b border-[var(--theme-border)] last:border-b-0 align-middle">
                  <td className="px-2 py-1">
                    <input
                      value={it.description}
                      onChange={(e: ChangeEvent<HTMLInputElement>): void => updateItemById(it.id, { description: e.target.value })}
                      className={inputBase}
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-2">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={it.quantity}
                      onChange={(e: ChangeEvent<HTMLInputElement>): void => updateItemById(it.id, { quantity: Number(e.target.value) })}
                      className={inputRight}
                    />
                  </td>
                  <td className="px-2">
                    <div className="flex items-center gap-1">
                      <span className="opacity-70">$</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={(Number(it.unitPriceCents) || 0) / 100}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void => {
                          const dollars = Number(e.target.value) || 0;
                          updateItemById(it.id, { unitPriceCents: Math.round(dollars * 100) });
                        }}
                        className={inputRight}
                      />
                    </div>
                  </td>
                  <td className="px-2">{money(amount)}</td>
                  <td className="px-2">
                    <button
                      type="button"
                      onClick={(): void => removeItemById(it.id)}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Tax Rate</span>
          <input
            type="number"
            step=".001"
            min={0}
            value={taxRate}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setTaxRate(Number(e.target.value) || 0)}
            className={inputBase}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Discount (%)</span>
          <input
            type="number"
            step="1"
            min={0}
            value={discountPercent}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setDiscountPercent(Number(e.target.value) || 0)}
            className={inputBase}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm opacity-70">Shipping (USD)</span>
          <input
            type="number"
            step="1"
            min={0}
            value={(shippingCents || 0) / 100}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setShippingCents(Math.round((Number(e.target.value) || 0) * 100))}
            className={inputBase}
          />
        </label>
      </div>

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
