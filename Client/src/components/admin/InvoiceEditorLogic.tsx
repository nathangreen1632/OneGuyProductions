import React, { type RefObject, useMemo, useRef, useState } from 'react';
import type { InvoiceItem } from '../../types/invoice.types';
import { computeTotals } from '../../helpers/money.helper';
import InvoiceEditorView, {
  type TInvoiceEditorViewPropsType,
} from '../../jsx/admin/invoiceEditorView';

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
  if (c?.randomUUID) return c.randomUUID();

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

export default function InvoiceEditorLogic({
                                        orderId,
                                        initialItems = [],
                                        initialTaxRate = 0,
                                        initialDiscountCents = 0,
                                        initialShippingCents = 0,
                                      }: TPropsType): React.ReactElement {

  const seededItems: TLineItemType[] = useMemo(
    () =>
      (initialItems ?? []).map((it) => ({
        id: makeId(),
        description: it.description ?? '',
        quantity: Number(it.quantity) || 0,
        unitPriceCents: Number(it.unitPriceCents) || 0,
      })),
    [initialItems]
  );

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
    return subtotalInit > 0 && initialDiscountCents > 0
      ? (initialDiscountCents / subtotalInit) * 100
      : 0;
  }, [initialItems, initialDiscountCents]);

  const [discountPercent, setDiscountPercent] = useState<number>(initialPercent);

  const hoursRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
  const rateRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
  const noteRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);

  const subtotalCents: number = useMemo(
    (): number =>
      items.reduce((sum: number, it: TLineItemType): number => {
        const q: number = Math.max(0, Number(it.quantity) || 0);
        const unit: number = Math.max(0, Number(it.unitPriceCents) || 0);
        return sum + q * unit;
      }, 0),
    [items]
  );

  const discountCentsFromPercent: number = useMemo((): number => {
    const pct: number = Math.max(0, Number(discountPercent) || 0) / 100;
    return Math.round(subtotalCents * pct);
  }, [discountPercent, subtotalCents]);

  const totals = useMemo(
    () =>
      computeTotals(
        items.map<TPlainInvoiceItemType>(({ description, quantity, unitPriceCents }: TLineItemType): {description: string; quantity: number; unitPriceCents: number} => ({
          description,
          quantity,
          unitPriceCents,
        })),
        { taxRate, discountCents: discountCentsFromPercent, shippingCents }
      ),
    [items, taxRate, discountCentsFromPercent, shippingCents]
  );

  function addBlankItem(): void {
    setItems((prev: TLineItemType[]): TLineItemType[] => [...prev, { id: makeId(), description: '', quantity: 1, unitPriceCents: 0 }]);
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

  function updateItemDescription(id: string, desc: string): void {
    setItems((prev: TLineItemType[]): TLineItemType[] => prev.map((it: TLineItemType): TLineItemType => (it.id === id ? { ...it, description: desc } : it)));
  }

  function updateItemQuantity(id: string, quantity: number): void {
    setItems((prev: TLineItemType[]): TLineItemType[] => prev.map((it: TLineItemType): TLineItemType => (it.id === id ? { ...it, quantity } : it)));
  }

  function updateItemUnitPriceDollars(id: string, dollars: number): void {
    const cents: number = Math.round((Number(dollars) || 0) * 100);
    setItems((prev: TLineItemType[]): TLineItemType[] => prev.map((it: TLineItemType): TLineItemType => (it.id === id ? { ...it, unitPriceCents: cents } : it)));
  }

  function removeItemById(id: string): void {
    setItems((prev: TLineItemType[]): TLineItemType[] => prev.filter((it: TLineItemType): boolean => it.id !== id));
  }

  async function saveInvoice(): Promise<void> {
    setSaving(true);
    try {
      const plainItems: TPlainInvoiceItemType[] = items.map(({ description, quantity, unitPriceCents }: TLineItemType): {description: string; quantity: number; unitPriceCents: number} => ({
        description,
        quantity,
        unitPriceCents,
      }));

      const res: Response = await fetch(`/api/order/${orderId}/invoice`, {
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
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = `order-${orderId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const viewProps: TInvoiceEditorViewPropsType = {
    items,
    taxRate,
    discountPercent,
    shippingCents,
    saving,
    totals,
    hoursRef,
    rateRef,
    noteRef,

    onAddTime: addTimeEntry,
    onAddBlankItem: addBlankItem,
    onDescriptionChange: updateItemDescription,
    onQuantityChange: updateItemQuantity,
    onUnitPriceChange: updateItemUnitPriceDollars,
    onRemoveItem: removeItemById,
    onTaxRateChange: (v: number): void => setTaxRate(v || 0),
    onDiscountPercentChange: (v: number): void => setDiscountPercent(v || 0),
    onShippingDollarsChange: (v: number): void => setShippingCents(Math.round((Number(v) || 0) * 100)),
    onSave: saveInvoice,
    onDownloadPdf: downloadPdf,
  };

  return <InvoiceEditorView {...viewProps} />;
}
