import { PDFDocument, StandardFonts, RGB, rgb } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import type {
  TTextStyleType,
  TItemRowType,
  TTaskRowType,
  TDrawLineFnType,
  TDrawRightAlignedPairsOptsType,
  TDrawItemsTableOptsType,
} from '../types/pdf.types.js';
import { money } from './money.helper.js';
import {EnvConfig} from "../config/env.config.js";

export type ItemRow = TItemRowType;
export type TaskRow = TTaskRowType;

export interface PdfCtx {
  pdfDoc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  SIDE: number;
  TOP: number;
  BOTTOM: number;
  contentWidth: number;
  drawLineRaw: TDrawLineFnType;
  drawHeaderOnly: TDrawLineFnType;
}

export interface LayoutCtx {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  SIDE: number;
  TOP: number;
  BOTTOM: number;
  contentWidth: number;
}

const CTRL_OR_FORMAT: RegExp = /[\p{Cc}\p{Cf}]/gu;

export function sanitizeInline(v: string): string {
  if (!v) return '';
  return v.replace(CTRL_OR_FORMAT, '').replace(/\s+/g, ' ').trim();
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
    case 'string': return sanitizeInline(v);
    case 'number':
    case 'boolean':
    case 'bigint': return String(v);
    case 'symbol': return sanitizeInline((v.description ?? '').toString());
    case 'function': return '';
    default: return null;
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

export async function createPdfCtx(): Promise<PdfCtx> {
  const pdfDoc: PDFDocument = await PDFDocument.create();
  const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page: PDFPage = pdfDoc.addPage([612, 792]);
  const SIDE = 48;
  const contentWidth: number = page.getSize().width - SIDE * 2;
  const TOP: number = page.getSize().height - SIDE;
  const BOTTOM = 64;

  const drawLineRaw: TDrawLineFnType = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5): void => {
    try { page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: rgb(0.85,0.85,0.85) }); } catch {}
  };
  const drawHeaderOnly: TDrawLineFnType = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5): void => {
    if ((thickness ?? 0.5) >= 0.5) drawLineRaw(x1, y1, x2, y2, thickness);
  };

  return { pdfDoc, page, font, fontBold, SIDE, TOP, BOTTOM, contentWidth, drawLineRaw, drawHeaderOnly };
}

export async function embedLogoFromOrderOrEnv(opts: {
  ctx: LayoutCtx;
  orderLike: unknown;
  x?: number;
  yTop?: number;
  maxW?: number;
  maxH?: number;
}): Promise<void> {
  const { ctx, orderLike, x = ctx.SIDE, yTop = ctx.TOP, maxW = 200, maxH = 55 } = opts;
  const {page } = (ctx as unknown as PdfCtx);

  try {
    const o = orderLike as Record<string, unknown>;
    const env: string | undefined = (typeof process !== 'undefined' && EnvConfig.LOGO_BASE64) || undefined;
    const logoB64: string | undefined =
      (o?.logoBase64 as string | undefined) ||
      (o?.companyLogoBase64 as string | undefined) ||
      env ||
      undefined;

    if (!logoB64) return;

    const raw: string = (logoB64.includes(',') ? logoB64.split(',').pop() : logoB64) ?? '';
    const bytes: Buffer<ArrayBuffer> = Buffer.from(raw, 'base64');

    let img: PDFImage | null = null;
    try { img = await (ctx as unknown as PdfCtx).pdfDoc.embedPng(bytes); } catch {}
    if (!img) { try { img = await (ctx as unknown as PdfCtx).pdfDoc.embedJpg(bytes); } catch {} }
    if (img) drawLogo(page, img, x, yTop, maxW, maxH);
  } catch {

  }
}

export function drawAmountDueAndDate(opts: {
  ctx: LayoutCtx;
  totalCents: number;
  invoiceCreatedAt?: unknown;
}): void {
  const { ctx, totalCents, invoiceCreatedAt } = opts;
  const { page, font, fontBold, SIDE, contentWidth, TOP } = ctx;

  try {
    const totalText: string = money(totalCents);
    const totalSize = 20;
    const xTotal: number = SIDE + contentWidth - fontBold.widthOfTextAtSize(totalText, totalSize);
    const yTotal: number = TOP - 30;

    const labelText = 'Amount Due:';
    const labelSize = 25;
    const xLabel: number = xTotal - 8 - font.widthOfTextAtSize(labelText, labelSize);

    page.drawText(labelText, { x: xLabel, y: yTotal, size: labelSize, font, color: rgb(0,0,0) });
    page.drawText(totalText, { x: xTotal, y: yTotal, size: totalSize, font: fontBold, color: rgb(239/255,68/255,68/255) });

    const d: Date = invoiceCreatedAt ? new Date(invoiceCreatedAt as string) : new Date();
    const mm: string = String(d.getMonth() + 1).padStart(2, '0');
    const dd: string = String(d.getDate()).padStart(2, '0');
    const yyyy: number = d.getFullYear();
    const dateLabel = `Invoice Date: ${mm}-${dd}-${yyyy}`;
    const dateWidth: number = font.widthOfTextAtSize(dateLabel, 10);

    page.drawText(dateLabel, { x: SIDE + contentWidth - dateWidth, y: yTotal - 14, size: 10, font, color: rgb(0.45,0.45,0.45) });
  } catch {}
}

export function drawInvoiceNumber(opts: {
  ctx: LayoutCtx;
  invNum: string;
}): void {
  const { ctx, invNum } = opts;
  const { page, font, fontBold, TOP, SIDE } = ctx;
  try {
    const yLabel: number = TOP - 78;
    const xLeft: number = SIDE;
    const invoiceWord = 'Invoice #: ';
    const invoiceWordWidth: number = font.widthOfTextAtSize(invoiceWord, 12);
    page.drawText(invoiceWord, { x: xLeft, y: yLabel, size: 12, font: fontBold, color: rgb(239/255,68/255,68/255) });
    page.drawText(` ${invNum}`, { x: xLeft + invoiceWordWidth, y: yLabel, size: 12, font, color: rgb(0,0,0) });
  } catch {}
}

export function drawTwoColumnsBlock(opts: {
  ctx: LayoutCtx;
  customerLines: string[];
  companyLines: string[];
}): number {
  const { ctx, customerLines, companyLines } = opts;
  const { page, fontBold, SIDE, TOP, contentWidth } = ctx;

  try {
    const colWidth: number = Math.floor(contentWidth / 2 - 12);
    const gap = 24;
    const xLeft: number = SIDE;
    const xRight: number = SIDE + colWidth + gap;

    page.drawText('Customer',            { x: xLeft,  y: TOP - 104, size: 12, font: fontBold, color: rgb(239/255,68/255,68/255) });
    page.drawText('One Guy Productions', { x: xRight, y: TOP - 104, size: 12, font: fontBold, color: rgb(239/255,68/255,68/255) });

    const yColTop: number = TOP - 120;
    const yLeftEnd: number  = drawLinesColumn({ ctx, x: xLeft,  yStart: yColTop, lines: customerLines, maxWidth: colWidth, size: 12, lineWrapGap: 2, rowGap: 12 });
    const yRightEnd: number = drawLinesColumn({ ctx, x: xRight, yStart: yColTop, lines: companyLines,  maxWidth: colWidth, size: 12, lineWrapGap: 2, rowGap: 14 });

    return Math.min(yLeftEnd, yRightEnd) - 24;
  } catch {
    return TOP - 144;
  }
}

export function drawLinesColumn(opts: {
  ctx: LayoutCtx;
  x: number;
  yStart: number;
  lines: string[];
  maxWidth: number;
  size?: number;
  lineWrapGap?: number;
  rowGap?: number;
}): number {
  const { ctx, x, yStart, lines, maxWidth, size = 12, lineWrapGap = 2, rowGap = 12 } = opts;
  const { page, font } = ctx;
  const style = { font, size, color: { r: 0, g: 0, b: 0 } };
  let yCursor: number = yStart;
  for (const ln of lines) {
    yCursor = layoutRichText(page, ln, x, yCursor, maxWidth, style, lineWrapGap);
    yCursor -= rowGap;
  }
  return yCursor;
}

export function drawTasksAndItems(opts: {
  ctx: LayoutCtx;
  yStart: number;
  tasks: TTaskRowType[];
  items: TItemRowType[];
  drawHeaderOnly?: TDrawLineFnType;
}): number {
  const { ctx, yStart, tasks, items, drawHeaderOnly } = opts;
  const { page, font, fontBold, SIDE, contentWidth } = ctx;
  const headerLine: TDrawLineFnType = drawHeaderOnly ?? (ctx as unknown as PdfCtx).drawHeaderOnly;

  let y: number = yStart;

  if (tasks.length > 0) {
    y = drawItemsTable({
      page, font, fontBold,
      xLeft: SIDE,
      yTop: y,
      width: contentWidth,
      rows: tasks.map(t => ({
        description: `${sanitizeInline(String(t.task || 'Task'))} (${Math.max(0, Number(t.hours) || 0)}h @ $${(Math.max(0, Number(t.rateCents) || 0) / 100).toFixed(2)}/h)`,
        quantity: Math.max(0, Number(t.hours) || 0),
        unitPriceCents: Math.max(0, Number(t.rateCents) || 0),
      })),
      line: headerLine,
      header: 'Task',
    }) - 8;
  }

  return drawItemsTable({
    page, font, fontBold,
    xLeft: SIDE,
    yTop: y,
    width: contentWidth,
    rows: items,
    line: headerLine,
    header: '',
  });
}

export function drawTermsAndRemarks(opts: {
  ctx: LayoutCtx;
  yStart: number;
  terms: string;
  remarks: string;
}): void {
  const { ctx, yStart, terms, remarks } = opts;
  const { page, font, fontBold, SIDE, contentWidth } = ctx;

  try {
    const bodyStyle12 = { font, size: 12, color: { r: 0, g: 0, b: 0 } };
    const termsLabelY: number = yStart - 10;
    page.drawText('Terms',   { x: SIDE, y: termsLabelY, size: 12, font: fontBold, color: rgb(239/255,68/255,68/255) });
    layoutRichText(page, terms,   SIDE, termsLabelY - 16, Math.floor(contentWidth / 2 - 24), bodyStyle12, 4);

    const remarksY: number = termsLabelY - 56;
    page.drawText('Remarks', { x: SIDE, y: remarksY, size: 12, font: fontBold, color: rgb(239/255,68/255,68/255) });
    layoutRichText(page, remarks, SIDE, remarksY - 16, Math.floor(contentWidth / 2 - 24), bodyStyle12, 4);
  } catch {}
}

export function drawTotalsBlock(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  SIDE: number,
  BOTTOM: number,
  contentWidth: number,
  totals: { subtotal: number; discount: number; tax: number; shipping: number; total: number }
): void {
  try {
    try { page.drawLine({ start: { x: SIDE, y: BOTTOM }, end: { x: SIDE + contentWidth, y: BOTTOM }, thickness: 0.6, color: rgb(0.85,0.85,0.85) }); } catch {}

    const pairs = [
      { label: 'Subtotal', value: money(totals.subtotal) },
      ...(totals.discount ? [{ label: 'Discount', value: `-${money(totals.discount)}` }] : []),
      ...(totals.tax ? [{ label: 'Tax', value: money(totals.tax) }] : []),
      ...(totals.shipping ? [{ label: 'Shipping', value: money(totals.shipping) }] : []),
      { label: 'Total', value: money(totals.total), bold: true as const },
    ];

    const rowsCount: number = pairs.length;
    const rowGap = 16;
    const startY: number = BOTTOM + 12 + (rowsCount - 1) * rowGap;

    drawRightAlignedPairs({
      page, font, fontBold,
      xRight: SIDE + contentWidth,
      startY,
      rows: pairs,
      size: 12,
      rowGap,
    });
  } catch {

  }
}
