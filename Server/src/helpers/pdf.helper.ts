import { rgb } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import type {
  TTextStyleType,
  TItemRowType,
  TTaskRowType,
  TDrawLineFnType,
  TDrawRightAlignedPairsOptsType,
  TDrawItemsTableOptsType,
} from '../types/pdf.types.js';

// (Optional) back-compat aliases — remove once callers are migrated
export type ItemRow = TItemRowType;
export type TaskRow = TTaskRowType;
/* ──────────────────────────────────────────────────────────────
   Sanitizer
   ────────────────────────────────────────────────────────────── */

const CTRL_OR_FORMAT: RegExp = /[\p{Cc}\p{Cf}]/gu; // Unicode controls & formats

export function sanitizeInline(v: string): string {
  if (!v) return '';
  return v.replace(CTRL_OR_FORMAT, '').replace(/\s+/g, ' ').trim();
}

/* ──────────────────────────────────────────────────────────────
   Drawing helpers
   ────────────────────────────────────────────────────────────── */

export function makeDrawLine(
  page: PDFPage,
  color = rgb(0.85, 0.85, 0.85)
): TDrawLineFnType {
  return (x1, y1, x2, y2, thickness = 0.5): void => {
    try {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
    } catch {
      /* no-throw */
    }
  };
}

export function layoutRichText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  style: TTextStyleType,
  lineGap = 4
): number {
  const color = style.color ?? { r: 0, g: 0, b: 0 };
  const words: string[] = sanitizeInline(text).split(' ');
  let line = '';
  let cursorY = y;

  for (const w of words) {
    const test = (line ? line + ' ' : '') + w;
    const width = style.font.widthOfTextAtSize(test, style.size);
    if (width > maxWidth && line) {
      try {
        page.drawText(line, { x, y: cursorY, size: style.size, font: style.font, color: rgb(color.r, color.g, color.b) });
      } catch { /* no-throw */ }
      cursorY -= style.size + lineGap;
      line = w;
    } else {
      line = test;
    }
  }

  if (line) {
    try {
      page.drawText(line, { x, y: cursorY, size: style.size, font: style.font, color: rgb(color.r, color.g, color.b) });
    } catch { /* no-throw */ }
  }
  return cursorY;
}

/* Right-aligned key/value pairs (totals). */
export function drawRightAlignedPairs(opts: TDrawRightAlignedPairsOptsType): void {
  const {
    page, font, fontBold, xRight, startY, rows,
    size = 12,
    rowGap = 14,
    labelColumnWidth = 220,
  } = opts;

  let y = startY;
  for (const r of rows) {
    const face = r.bold ? fontBold : font;
    const valueWidth = face.widthOfTextAtSize(r.value, size);
    try {
      page.drawText(r.label, { x: xRight - labelColumnWidth, y, size, font, color: rgb(0, 0, 0) });
      page.drawText(r.value, { x: xRight - valueWidth,     y, size, font: face, color: rgb(0, 0, 0) });
    } catch { /* no-throw */ }
    y -= rowGap;
  }
  // no return
}

/* Items table — normalized to 12pt */
export function drawItemsTable(opts: TDrawItemsTableOptsType): number {
  const { page, font, fontBold, xLeft, yTop, width, rows, line, header } = opts;

  const colDescW = Math.floor(width * 0.58);
  const colQtyW  = Math.floor(width * 0.10);
  const colUnitW = Math.floor(width * 0.14);
  const colAmtW  = width - (colDescW + colQtyW + colUnitW);

  let y = yTop;

  if (header) {
    try {
      page.drawText(header, { x: xLeft, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      y -= 14;
    } catch { /* no-throw */ }
  }

  try {
    page.drawText('Description', { x: xLeft, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Qty',         { x: xLeft + colDescW,                   y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Price',       { x: xLeft + colDescW + colQtyW,         y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Total',       { x: xLeft + colDescW + colQtyW + colUnitW, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  } catch { /* no-throw */ }

  y -= 8;
  line(xLeft, y, xLeft + width, y, 0.5);
  y -= 12;

  const style: TTextStyleType = { font, size: 12, color: { r: 0, g: 0, b: 0 } };

  for (const r of rows) {
    const totalCents = Math.max(0, (Number(r.quantity) || 0) * (Number(r.unitPriceCents) || 0));
    y = layoutRichText(page, sanitizeInline(r.description), xLeft, y, colDescW - 6, style, 4);
    try {
      page.drawText(String(Number(r.quantity) || 0), { x: xLeft + colDescW + 6, y, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText((Math.max(0, Number(r.unitPriceCents) || 0) / 100).toFixed(2), { x: xLeft + colDescW + colQtyW + 6, y, size: 12, font, color: rgb(0, 0, 0) });
      const v  = (totalCents / 100).toFixed(2);
      const vW = font.widthOfTextAtSize(v, 12);
      page.drawText(v, { x: xLeft + colDescW + colQtyW + colUnitW + colAmtW - vW, y, size: 12, font, color: rgb(0, 0, 0) });
    } catch { /* no-throw */ }
    y -= 18;
  }

  return y;
}

/* Company logo */
export function drawLogo(
  page: PDFPage,
  img: PDFImage | null,
  x: number,
  yTop: number,
  maxW = 160,
  maxH = 44
): void {
  if (!img) return;
  try {
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    page.drawImage(img, { x, y: yTop - h, width: w, height: h, opacity: 1 });
  } catch {
    /* no-throw */
  }
}

/* Page numbers */
export function drawPageNumbers(
  page: PDFPage,
  font: PDFFont,
  pageIndex: number,
  pageCount: number,
  xRight: number,
  yBottom: number
): void {
  try {
    const text = `Page ${pageIndex + 1} of ${pageCount}`;
    const w = font.widthOfTextAtSize(text, 9);
    page.drawText(text, { x: xRight - w, y: yBottom, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
  } catch {
    /* no-throw */
  }
}

/* ──────────────────────────────────────────────────────────────
   Safe stringification for PDF fields
   ────────────────────────────────────────────────────────────── */

export const JSON_BIGINT_REPLACER: (k: string, val: unknown) => unknown = (_k, val) =>
  (typeof val === 'bigint' ? String(val) : val);

export function inlineFromPrimitive(v: unknown): string | null {
  switch (typeof v) {
    case 'string':  return sanitizeInline(v);
    case 'number':
    case 'boolean':
    case 'bigint':  return String(v);
    case 'symbol':  return sanitizeInline((v.description ?? '').toString());
    case 'function': return '';
    default:         return null;
  }
}

export function inlineFromDateLike(v: unknown): string | null {
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? '' : sanitizeInline(v.toLocaleString());
  }
  const o = v as { toISOString?: () => string } | null;
  if (o && typeof o.toISOString === 'function') {
    try {
      const d = new Date(o.toISOString());
      return Number.isNaN(d.getTime()) ? '' : sanitizeInline(d.toLocaleString());
    } catch { /* no-throw */ }
  }
  return null;
}

export function pdfSafeString(v: unknown): string {
  if (v == null) return '';
  const p = inlineFromPrimitive(v); if (p !== null) return p;
  const d = inlineFromDateLike(v);  if (d !== null) return d;
  try {
    const json = JSON.stringify(v, JSON_BIGINT_REPLACER);
    return json ? sanitizeInline(json) : '';
  } catch {
    return '';
  }
}
