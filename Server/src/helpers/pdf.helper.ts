import {RGB, rgb} from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import type {
  TTextStyleType,
  TItemRowType,
  TTaskRowType,
  TDrawLineFnType,
  TDrawRightAlignedPairsOptsType,
  TDrawItemsTableOptsType,
} from '../types/pdf.types.js';

export type ItemRow = TItemRowType;
export type TaskRow = TTaskRowType;

const CTRL_OR_FORMAT: RegExp = /[\p{Cc}\p{Cf}]/gu;

export function sanitizeInline(v: string): string {
  if (!v) return '';
  return v.replace(CTRL_OR_FORMAT, '').replace(/\s+/g, ' ').trim();
}

export function makeDrawLine(
  page: PDFPage,
  color: RGB = rgb(0.85, 0.85, 0.85)
): TDrawLineFnType {
  return (x1: number, y1: number, x2: number, y2: number, thickness = 0.5): void => {
    try {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
    } catch {

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
  const color: {r: number; g: number; b: number} = style.color ?? { r: 0, g: 0, b: 0 };
  const words: string[] = sanitizeInline(text).split(' ');
  let line: string = '';
  let cursorY: number = y;

  for (const w of words) {
    const test: string = (line ? line + ' ' : '') + w;
    const width: number = style.font.widthOfTextAtSize(test, style.size);
    if (width > maxWidth && line) {
      try {
        page.drawText(line, { x, y: cursorY, size: style.size, font: style.font, color: rgb(color.r, color.g, color.b) });
      } catch {  }
      cursorY -= style.size + lineGap;
      line = w;
    } else {
      line = test;
    }
  }

  if (line) {
    try {
      page.drawText(line, { x, y: cursorY, size: style.size, font: style.font, color: rgb(color.r, color.g, color.b) });
    } catch {  }
  }
  return cursorY;
}

export function drawRightAlignedPairs(opts: TDrawRightAlignedPairsOptsType): void {
  const {
    page, font, fontBold, xRight, startY, rows,
    size = 12,
    rowGap = 14,
    labelColumnWidth = 220,
  } = opts;

  let y: number = startY;
  for (const r of rows) {
    const face: PDFFont = r.bold ? fontBold : font;
    const valueWidth: number = face.widthOfTextAtSize(r.value, size);

    const labelColor: RGB = rgb(0, 0, 0);
    const isTotal: boolean = r.label.trim().toLowerCase() === 'total';
    const valueColor: RGB = isTotal ? rgb(239 / 255, 68 / 255, 68 / 255) : rgb(0, 0, 0);

    try {
      page.drawText(r.label, { x: xRight - labelColumnWidth, y, size, font, color: labelColor });
      page.drawText(r.value, { x: xRight - valueWidth,     y, size, font: face, color: valueColor });
    } catch {  }
    y -= rowGap;
  }
}


export function drawItemsTable(opts: TDrawItemsTableOptsType): number {
  const { page, font, fontBold, xLeft, yTop, width, rows, line, header } = opts;

  const colDescW: number = Math.floor(width * 0.58);
  const colQtyW: number  = Math.floor(width * 0.10);
  const colUnitW: number = Math.floor(width * 0.14);
  const colAmtW: number  = width - (colDescW + colQtyW + colUnitW);

  let y: number = yTop;

  if (header) {
    try {
      page.drawText(header, { x: xLeft, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      y -= 14;
    } catch {  }
  }

  try {
    page.drawText('Description', { x: xLeft, y, size: 12, font: fontBold, color: rgb(239/255, 68/255, 68/255) });
    page.drawText('Qty',         { x: xLeft + colDescW,                   y, size: 12, font: fontBold, color: rgb(239/255, 68/255, 68/255) });
    page.drawText('Price',       { x: xLeft + colDescW + colQtyW,         y, size: 12, font: fontBold, color: rgb(239/255, 68/255, 68/255) });

    const totalHeader = 'Total';
    const totalHeaderWidth: number = fontBold.widthOfTextAtSize(totalHeader, 12);
    const xTotalHeader: number = xLeft + colDescW + colQtyW + colUnitW + colAmtW - totalHeaderWidth;

    page.drawText(totalHeader, { x: xTotalHeader, y, size: 12, font: fontBold, color: rgb(239/255, 68/255, 68/255) });
  } catch {  }

  y -= 8;
  line(xLeft, y, xLeft + width, y, 0.5);
  y -= 12;

  const style: TTextStyleType = { font, size: 12, color: { r: 0, g: 0, b: 0 } };

  for (const r of rows) {
    const totalCents: number = Math.max(0, (Number(r.quantity) || 0) * (Number(r.unitPriceCents) || 0));
    y = layoutRichText(page, sanitizeInline(r.description), xLeft, y, colDescW - 6, style, 4);
    try {
      page.drawText(String(Number(r.quantity) || 0), { x: xLeft + colDescW + 6, y, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText((Math.max(0, Number(r.unitPriceCents) || 0) / 100).toFixed(2), { x: xLeft + colDescW + colQtyW + 6, y, size: 12, font, color: rgb(0, 0, 0) });
      const v: string  = (totalCents / 100).toFixed(2);
      const vW: number = font.widthOfTextAtSize(v, 12);
      page.drawText(v, { x: xLeft + colDescW + colQtyW + colUnitW + colAmtW - vW, y, size: 12, font, color: rgb(0, 0, 0) });
    } catch {  }
    y -= 18;
  }

  return y;
}

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
    const scale: number = Math.min(maxW / img.width, maxH / img.height);
    const w: number = img.width * scale;
    const h: number = img.height * scale;
    page.drawImage(img, { x, y: yTop - h, width: w, height: h, opacity: 1 });
  } catch {

  }
}

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
    const w: number = font.widthOfTextAtSize(text, 9);
    page.drawText(text, { x: xRight - w, y: yBottom, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
  } catch {

  }
}

export const JSON_BIGINT_REPLACER: (k: string, val: unknown) => unknown = (_k: string, val: unknown): unknown =>
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
    } catch {  }
  }
  return null;
}

export function pdfSafeString(v: unknown): string {
  if (v == null) return '';
  const p: string | null = inlineFromPrimitive(v); if (p !== null) return p;
  const d: string | null = inlineFromDateLike(v);  if (d !== null) return d;
  try {
    const json: string = JSON.stringify(v, JSON_BIGINT_REPLACER);
    return json ? sanitizeInline(json) : '';
  } catch {
    return '';
  }
}
