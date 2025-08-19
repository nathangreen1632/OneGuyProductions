import { rgb } from 'pdf-lib';
import type { PDFFont } from 'pdf-lib';

export type Run = { text: string; bold: boolean };
export type Seg = { text: string; w: number; bold: boolean; f: PDFFont };

export type TextStyle = {
  font: PDFFont;
  fontBold: PDFFont;
  size: number;
  color: [number, number, number];
};

export type ItemRow = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

function stripControlsExceptNewlines(s: string): string {
  return s.replace(/\p{Cc}/gu, ch => (ch === '\n' || ch === '\r' ? ch : ''));
}

function stripAllControls(s: string): string {
  return s.replace(/\p{Cc}/gu, '');
}

export function splitParagraphs(text: string): string[] {
  return stripControlsExceptNewlines(String(text ?? ''))
    .replace(/\r\n?/g, '\n')
    .split('\n');
}

export function sanitizeInline(token: string): string {
  return stripAllControls(String(token ?? ''));
}

export function parseBoldRuns(line: string): Run[] {
  const out: Run[] = [];
  let i: number = 0, bold: boolean = false;
  while (i < line.length) {
    if (line[i] === '*' && line[i + 1] === '*') { bold = !bold; i += 2; continue; }
    let j: number = i;
    while (j < line.length && !(line[j] === '*' && line[j + 1] === '*')) j++;
    const chunk: string = line.slice(i, j);
    if (chunk) out.push({ text: chunk, bold });
    i = j;
  }
  return out.length ? out : [{ text: line, bold: false }];
}

export function tokenizeRuns(
  runs: Run[],
  font: PDFFont,
  fontBold: PDFFont,
  size: number
): Seg[] {
  const segs: Seg[] = [];
  for (const r of runs) {
    const f: PDFFont = r.bold ? fontBold : font;
    for (const tok of r.text.split(/(\s+)/)) {
      if (tok === '') continue;
      const t: string = sanitizeInline(tok);
      const w: number = t ? f.widthOfTextAtSize(t, size) : 0;
      segs.push({ text: t, w, bold: r.bold, f });
    }
  }
  return segs;
}

export function wrapSegmentsIntoLines(segs: Seg[], maxWidth: number): Run[][] {
  const lines: Run[][] = [];
  let line: Run[] = [];
  let lineW: number = 0;

  for (const s of segs) {
    if (line.length > 0 && lineW + s.w > maxWidth) {
      lines.push(line);
      line = [];
      lineW = 0;
    }
    if (s.text) {
      line.push({ text: s.text, bold: s.bold });
      lineW += s.w;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

export function ensureParagraphGap(
  cursor: { y: number },
  gap: number,
  bottomContentMargin: number,
  newPage: () => void
): void {
  if (cursor.y - gap < bottomContentMargin) newPage();
  cursor.y -= gap;
}

export function ensureLineSpace(
  cursor: { y: number },
  need: number,
  bottomContentMargin: number,
  newPage: () => void
): void {
  if (cursor.y - need < bottomContentMargin) newPage();
}

export function drawStyledLine(
  page: any,
  x: number,
  y: number,
  segments: Run[],
  style: TextStyle
): void {
  const { font, fontBold, size, color } = style;
  let cx = x;
  for (const seg of segments) {
    const txt = sanitizeInline(seg.text);
    if (!txt) continue;
    const f = seg.bold ? fontBold : font;
    page.drawText(txt, { x: cx, y, size, font: f, color: rgb(...color) });
    cx += f.widthOfTextAtSize(txt, size);
  }
}

export function layoutRichText(params: {
  pageRef: { page: any };
  newPage: () => void;
  cursor: { y: number };
  x: number;
  contentWidth: number;
  bottomContentMargin: number;
  lineHeight: number;
  paraGap: number;
  style: TextStyle;
  text: string;
}): void {
  const {
    pageRef, newPage, cursor, x, contentWidth, bottomContentMargin,
    lineHeight, paraGap, style, text
  } = params;

  const { font, fontBold, size } = style;
  const paragraphs = splitParagraphs(text);

  for (const raw of paragraphs) {
    if (raw.length === 0) {
      ensureParagraphGap(cursor, paraGap, bottomContentMargin, newPage);
      continue;
    }
    const runs: Run[] = parseBoldRuns(raw);
    const segs: Seg[] = tokenizeRuns(runs, font, fontBold, size);
    const lines: Run[][] = wrapSegmentsIntoLines(segs, contentWidth);
    for (const ln of lines) {
      ensureLineSpace(cursor, lineHeight, bottomContentMargin, newPage);
      cursor.y -= lineHeight;
      drawStyledLine(pageRef.page, x, cursor.y, ln, style);
    }
  }
}

export function drawTwoCol(
  page: any,
  left: string,
  right: string,
  y: number,
  opts: {
    xLeft: number; xRight: number; size: number; bold?: boolean;
    color: [number, number, number]; font: PDFFont; fontBold: PDFFont;
  }
): void {
  const { xLeft, xRight, size, bold, color, font, fontBold } = opts;
  page.drawText(left,  { x: xLeft,  y, size, font: bold ? fontBold : font, color: rgb(...color) });
  page.drawText(right, { x: xRight, y, size, font, color: rgb(...color) });
}

export function drawItemsTable(
  pageRef: { page: any },
  args: {
    cursor: { y: number }, newPage: () => void,
    width: number, left: number, bottom: number,
    font: PDFFont, fontBold: PDFFont,
    rows: ItemRow[],
    moneyFn: (cents: number) => string
  }
): void {
  const { cursor, newPage, width, left, bottom, font, fontBold, rows, moneyFn } = args;

  const colQtyW = 50, colUnitW = 90, colAmtW = 100;
  const colDescW: number = width - (colQtyW + colUnitW + colAmtW);
  const lh = 16;

  const needHeader: number = lh * 2;
  if (cursor.y - needHeader < bottom) newPage();
  cursor.y -= lh;

  const headers: {label: string; x: number; w: number;}[] = [
    { label: 'Description', x: left,                             w: colDescW },
    { label: 'Qty',         x: left + colDescW,                  w: colQtyW },
    { label: 'Unit',        x: left + colDescW + colQtyW,        w: colUnitW },
    { label: 'Amount',      x: left + colDescW + colQtyW + colUnitW, w: colAmtW },
  ];
  for (const h of headers) {
    pageRef.page.drawText(h.label, { x: h.x, y: cursor.y, size: 12, font: fontBold, color: rgb(0,0,0) });
  }
  cursor.y -= lh;

  for (const r of rows) {
    const qty: string  = String(r.quantity ?? 0);
    const unit: string = moneyFn(r.unitPriceCents ?? 0);
    const amt: string  = moneyFn((r.quantity || 0) * (r.unitPriceCents || 0));

    if (cursor.y - lh < bottom) { newPage(); cursor.y -= 6; }
    cursor.y -= lh;

    pageRef.page.drawText(String(r.description ?? '').slice(0, 90), { x: left, y: cursor.y, size: 11, font, color: rgb(0,0,0) });
    pageRef.page.drawText(qty,  { x: left + colDescW,                   y: cursor.y, size: 11, font, color: rgb(0,0,0) });
    pageRef.page.drawText(unit, { x: left + colDescW + colQtyW,         y: cursor.y, size: 11, font, color: rgb(0,0,0) });
    pageRef.page.drawText(amt,  { x: left + colDescW + colQtyW + colUnitW, y: cursor.y, size: 11, font, color: rgb(0,0,0) });
  }
}

export function makeDrawLine(opts: {
  pageRef: { page: any },
  cursor: { y: number },
  newPage: () => void,
  bottom: number,
  side: number,
  font: PDFFont,
  fontBold: PDFFont,
  defaultSize: number,
  defaultColor: [number, number, number],
}) {
  const { pageRef, cursor, newPage, bottom, side, font, fontBold, defaultSize, defaultColor } = opts;
  return (text: string, local?: { bold?: boolean; size?: number; leading?: number; color?: [number, number, number] }) => {
    const b: boolean  = local?.bold ?? false;
    const sz: number = local?.size ?? defaultSize;
    const lh: number = local?.leading ?? 18;
    const col: [number, number, number] = local?.color ?? defaultColor;
    if (cursor.y - lh < bottom) newPage();
    cursor.y -= lh;
    pageRef.page.drawText(sanitizeInline(text), {
      x: side, y: cursor.y, size: sz, font: b ? fontBold : font, color: rgb(...col),
    });
  };
}

export function paintHeaderFooter(opts: {
  pageRef: { page: any },
  cursor: { y: number },
  font: PDFFont,
  fontBold: PDFFont,
  sizeTitle: number,
  sizeFooter: number,
  side: number,
  topContent: number,
  footerY: number,
  colorBrand: [number, number, number],
  colorSuffix: [number, number, number],
  colorRule: [number, number, number],
  colorFooter: [number, number, number],
  brandText: string,
  suffixText: string,
  footerMsg: string,
}): void {
  const {
    pageRef, cursor, font, fontBold, sizeTitle, sizeFooter,
    side, topContent, footerY, colorBrand, colorSuffix, colorRule, colorFooter,
    brandText, suffixText, footerMsg,
  } = opts;

  const { width, height } = pageRef.page.getSize();
  const headerY: number = height - topContent;

  pageRef.page.drawText(brandText, {
    x: side, y: headerY, size: sizeTitle, font: fontBold, color: rgb(...colorBrand),
  });
  const brandW: number = fontBold.widthOfTextAtSize(brandText, sizeTitle);
  pageRef.page.drawText(suffixText, {
    x: side + brandW, y: headerY, size: sizeTitle, font: fontBold, color: rgb(...colorSuffix),
  });

  const ruleY: number = headerY - (sizeTitle + 6);
  pageRef.page.drawLine({
    start: { x: side, y: ruleY },
    end:   { x: width - side, y: ruleY },
    thickness: 0.75,
    color: rgb(...colorRule),
  });

  pageRef.page.drawText(sanitizeInline(footerMsg), {
    x: side, y: footerY, size: sizeFooter, font, color: rgb(...colorFooter),
  });

  cursor.y = ruleY - 16;
}

export function drawTwoAddressColumns(params: {
  pageRef: { page: any },
  cursor: { y: number },
  newPage: () => void,
  bottom: number,
  font: PDFFont,
  fontBold: PDFFont,
  headingColor: [number, number, number],
  bodyColor: [number, number, number],
  xLeft: number,
  xRight: number,
  headingSize?: number,
  rowLeading?: number,
  bodySize?: number,
  left: { heading: string; lines: string[] },
  right:{ heading: string; lines: string[] },
}): void {
  const {
    pageRef, cursor, newPage, bottom,
    font, fontBold, headingColor, bodyColor,
    xLeft, xRight,
    left, right,
    headingSize = 14,
    rowLeading = 16,
    bodySize = 11,
  } = params;

  const rowsNeeded: number = Math.max(left.lines.length, right.lines.length);
  const need: number = (rowsNeeded + 1) * rowLeading;
  if (cursor.y - need < bottom) newPage();

  cursor.y -= rowLeading;
  pageRef.page.drawText(left.heading,  { x: xLeft,  y: cursor.y, size: headingSize, font: fontBold, color: rgb(...headingColor) });
  pageRef.page.drawText(right.heading, { x: xRight, y: cursor.y, size: headingSize, font: fontBold, color: rgb(...headingColor) });

  for (let i: number = 0; i < rowsNeeded; i++) {
    cursor.y -= rowLeading;
    const l: string = left.lines[i]  ?? '';
    const r: string = right.lines[i] ?? '';
    drawTwoCol(pageRef.page, l, r, cursor.y, {
      xLeft, xRight, size: bodySize, bold: false, color: bodyColor, font, fontBold
    });
  }
  cursor.y -= 10;
}

export function drawOrderIdLine(params: {
  pageRef: { page: any },
  cursor: { y: number },
  newPage: () => void,
  bottom: number,
  side: number,
  font: PDFFont,
  fontBold: PDFFont,
  size: number,
  label: string,
  value: string,
  labelColor: [number, number, number],
  valueColor: [number, number, number],
  leading?: number,
}): void {
  const {
    pageRef, cursor, newPage, bottom, side, fontBold,
    size, label, value, labelColor, valueColor, leading = 18
  } = params;

  if (cursor.y - leading < bottom) newPage();
  cursor.y -= leading;

  pageRef.page.drawText(label, { x: side, y: cursor.y, size, font: fontBold, color: rgb(...labelColor) });
  const labelW: number = fontBold.widthOfTextAtSize(label, size);
  pageRef.page.drawText(value, { x: side + labelW, y: cursor.y, size, font: fontBold, color: rgb(...valueColor) });
}

export function drawRightAlignedPairs(params: {
  pageRef: { page: any },
  cursor: { y: number },
  newPage: () => void,
  bottom: number,
  labelX: number,
  valueX: number,
  pairs: Array<[string, string]>,
  font: PDFFont,
  fontBold: PDFFont,
  size?: number,
  leading?: number,
  color?: [number, number, number],
}): void {
  const {
    pageRef, cursor, newPage, bottom,
    labelX, valueX, pairs, font, fontBold,
    size = 12,
    leading = 16,
    color = [0,0,0],
  } = params;

  for (const [k, v] of pairs) {
    if (cursor.y - leading < bottom) newPage();
    cursor.y -= leading;
    pageRef.page.drawText(k, { x: labelX, y: cursor.y, size, font,      color: rgb(...color) });
    pageRef.page.drawText(v, { x: valueX, y: cursor.y, size, font: fontBold, color: rgb(...color) });
  }
}

export function drawPageNumbers(params: {
  pdfDoc: any,
  font: PDFFont,
  size: number,
  side: number,
  footerY: number,
  color: [number, number, number],
}): void {
  const { pdfDoc, font, size, side, footerY, color } = params;
  const pages = pdfDoc.getPages();
  const total = pages.length;
  for (let i: number = 0; i < total; i++) {
    const p = pages[i];
    const { width: pw } = p.getSize();
    const label = `Page ${i + 1} of ${total}`;
    const labelW: number = font.widthOfTextAtSize(label, size);
    p.drawText(label, {
      x: pw - side - labelW,
      y: footerY,
      size,
      font,
      color: rgb(...color),
    });
  }
}
