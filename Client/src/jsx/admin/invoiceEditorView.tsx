import React, { type ChangeEvent, type RefObject } from 'react';
import { X } from 'lucide-react';
import type { InvoiceItem } from '../../types/invoice.types';
import { money } from '../../helpers/money.helper';

export type TInvoiceEditorViewPropsType = Readonly<{
  items: Array<InvoiceItem & { id: string }>;
  taxRate: number;
  discountPercent: number;
  shippingCents: number;
  saving: boolean;
  totals: { subtotal: number; discount: number; tax: number; shipping: number; total: number };

  hoursRef: RefObject<HTMLInputElement | null>;
  rateRef: RefObject<HTMLInputElement | null>;
  noteRef: RefObject<HTMLInputElement | null>;

  onAddTime: (hours: number, rateDollars: number, note: string) => void;
  onAddBlankItem: () => void;
  onDescriptionChange: (id: string, value: string) => void;
  onQuantityChange: (id: string, value: number) => void;
  onUnitPriceChange: (id: string, dollars: number) => void;
  onRemoveItem: (id: string) => void;

  onTaxRateChange: (v: number) => void;
  onDiscountPercentChange: (v: number) => void;
  onShippingDollarsChange: (v: number) => void;

  onSave: () => void;
  onDownloadPdf: () => void;
}>;

export default function InvoiceEditorView(props: TInvoiceEditorViewPropsType): React.ReactElement {
  const {
    items,
    taxRate,
    discountPercent,
    shippingCents,
    saving,
    totals,

    hoursRef,
    rateRef,
    noteRef,

    onAddTime,
    onAddBlankItem,
    onDescriptionChange,
    onQuantityChange,
    onUnitPriceChange,
    onRemoveItem,

    onTaxRateChange,
    onDiscountPercentChange,
    onShippingDollarsChange,

    onSave,
    onDownloadPdf,
  } = props;

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

  return (
    <section
      className="rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)] p-3 sm:p-4 space-y-4"
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
            onAddTime(h, r, n);
          }}
        >
          + Add Time
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="sm:hidden space-y-2">
          {items.map((it: InvoiceItem & {id: string}, idx: number): React.ReactElement => {
            const amount: number = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
            return (
              <div
                key={it.id}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/60 p-2.5 space-y-2"
              >
                <input
                  value={it.description}
                  onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                    onDescriptionChange(it.id, e.target.value)
                  }
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
                      onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                        onQuantityChange(it.id, Number(e.target.value))
                      }
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
                      onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                        onUnitPriceChange(it.id, Number(e.target.value))
                      }
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
                    onClick={(): void => onRemoveItem(it.id)}
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
            {items.map((it: InvoiceItem & {id: string}): React.ReactElement => {
              const amount: number = (Number(it.quantity) || 0) * (Number(it.unitPriceCents) || 0);
              return (
                <tr key={it.id} className="border-b border-[var(--theme-border)] last:border-b-0 align-middle">
                  <td className="px-2 py-1">
                    <input
                      value={it.description}
                      onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                        onDescriptionChange(it.id, e.target.value)
                      }
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
                      onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                        onQuantityChange(it.id, Number(e.target.value))
                      }
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
                        onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                          onUnitPriceChange(it.id, Number(e.target.value))
                        }
                        className={inputRight}
                      />
                    </div>
                  </td>
                  <td className="px-2">{money(amount)}</td>
                  <td className="px-2">
                    <button
                      type="button"
                      onClick={(): void => onRemoveItem(it.id)}
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
            <button type="button" onClick={onAddBlankItem} className={btnBlue}>
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
            onChange={(e: ChangeEvent<HTMLInputElement>): void => onTaxRateChange(Number(e.target.value))}
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
            onChange={(e: ChangeEvent<HTMLInputElement>): void =>
              onDiscountPercentChange(Number(e.target.value))
            }
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
            onChange={(e: ChangeEvent<HTMLInputElement>): void =>
              onShippingDollarsChange(Number(e.target.value))
            }
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
        <button type="button" disabled={saving} onClick={onSave} className={btnPrimary}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onDownloadPdf} className={btnGreen}>
          Generate PDF
        </button>
      </div>
    </section>
  );
}
