import { rgb, PDFFont, PDFImage, PDFPage } from 'pdf-lib';

// Remove all Unicode Control & Format characters, then normalize whitespace
const CTRL_OR_FORMAT = /[\p{Cc}\p{Cf}]/gu;

export function sanitizeInline(v: string): string {
  if (!v) return '';
  return v
    .replace(CTRL_OR_FORMAT, '')   // no control chars in the literal → S6324 satisfied
    .replace(/\s+/g, ' ')
    .trim();
}


export type TextStyle = {
  size: number;
  font: PDFFont;
  color?: { r: number; g: number; b: number };
  opacity?: number;
};

export type ItemRow = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type TaskRow = {
  task: string;
  rateCents: number;
  hours: number;
};

export function makeDrawLine(page: PDFPage, color = rgb(0.85, 0.85, 0.85)) {
  return (x1: number, y1: number, x2: number, y2: number, thickness = 0.5) => {
    try {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
    } catch {
      // no-throw
    }
  };
}

export function layoutRichText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  style: TextStyle,
  lineGap = 4
): number {
  const color = style.color ?? { r: 0, g: 0, b: 0 };
  const words = sanitizeInline(text).split(' ');
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

export type RightPairsRow = { label: string; value: string; bold?: boolean };

export type DrawRightAlignedPairsOpts = {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  xRight: number;
  startY: number;
  rows: RightPairsRow[];
  size?: number;        // default 12
  rowGap?: number;      // default 14
  labelColumnWidth?: number; // default 220 (was hard-coded)
};

// Right-aligned key/value pairs (totals).
export function drawRightAlignedPairs(opts: DrawRightAlignedPairsOpts): void {
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
  // no return -> resolves Sonar "don't return y"
}


// Items table — now normalized to 12pt
export function drawItemsTable(opts: {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  xLeft: number;
  yTop: number;
  width: number;
  rows: ItemRow[];
  line: ReturnType<typeof makeDrawLine>;
  header?: string; // optional "Item" / "Task"
}) {
  const { page, font, fontBold, xLeft, yTop, width, rows, line, header } = opts;
  const colDescW = Math.floor(width * 0.58);
  const colQtyW = Math.floor(width * 0.10);
  const colUnitW = Math.floor(width * 0.14);
  const colAmtW = width - (colDescW + colQtyW + colUnitW);

  let y = yTop;

  if (header) {
    try {
      page.drawText(header, { x: xLeft, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
      y -= 14;
    } catch { /* no-throw */ }
  }

  // header row (12pt)
  try {
    page.drawText('Description', { x: xLeft, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Qty', { x: xLeft + colDescW, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Price', { x: xLeft + colDescW + colQtyW, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Total', { x: xLeft + colDescW + colQtyW + colUnitW, y, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  } catch { /* no-throw */ }

  y -= 8;
  line(xLeft, y, xLeft + width, y, 0.5);
  y -= 12;

  const style: TextStyle = { font, size: 12, color: { r: 0, g: 0, b: 0 } };

  for (const r of rows) {
    const totalCents = Math.max(0, (Number(r.quantity) || 0) * (Number(r.unitPriceCents) || 0));
    y = layoutRichText(page, sanitizeInline(r.description), xLeft, y, colDescW - 6, style, 4);
    try {
      page.drawText(String(Number(r.quantity) || 0), { x: xLeft + colDescW + 6, y, size: 12, font, color: rgb(0, 0, 0) });
      page.drawText((Math.max(0, Number(r.unitPriceCents) || 0) / 100).toFixed(2), { x: xLeft + colDescW + colQtyW + 6, y, size: 12, font, color: rgb(0, 0, 0) });
      const v = (totalCents / 100).toFixed(2);
      const vW = font.widthOfTextAtSize(v, 12);
      page.drawText(v, { x: xLeft + colDescW + colQtyW + colUnitW + colAmtW - vW, y, size: 12, font, color: rgb(0, 0, 0) });
    } catch { /* no-throw */ }
    y -= 18; // a touch more leading for 12pt text
  }

  return y;
}

// Optional: tasks table (Rate × Hours) — reused through drawItemsTable
export function drawTasksTable(opts: {
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  xLeft: number;
  yTop: number;
  width: number;
  rows: TaskRow[];
  line: ReturnType<typeof makeDrawLine>;
}) {
  const rows = opts.rows.map<TaskRow>((t) => ({
    task: sanitizeInline(t.task || 'Task'),
    rateCents: Math.max(0, Number(t.rateCents) || 0),
    hours: Math.max(0, Number(t.hours) || 0),
  }));

  const itemRows = rows.map((t) => ({
    description: `${t.task} (${t.hours}h @ $${(t.rateCents / 100).toFixed(2)}/h)`,
    quantity: t.hours,
    unitPriceCents: t.rateCents,
  }));

  return drawItemsTable({
    page: opts.page,
    font: opts.font,
    fontBold: opts.fontBold,
    xLeft: opts.xLeft,
    yTop: opts.yTop,
    width: opts.width,
    rows: itemRows,
    line: opts.line,
    header: 'Task',
  });
}

// Optional: company logo
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

export function drawPageNumbers(page: PDFPage, font: PDFFont, pageIndex: number, pageCount: number, xRight: number, yBottom: number) {
  try {
    const text = `Page ${pageIndex + 1} of ${pageCount}`;
    const w = font.widthOfTextAtSize(text, 9);
    page.drawText(text, { x: xRight - w, y: yBottom, size: 9, font, color: rgb(0.45, 0.45, 0.45) });
  } catch {
    /* no-throw */
  }
}

// BigInt-safe JSON replacer
export const JSON_BIGINT_REPLACER = (_k: string, val: unknown) =>
  (typeof val === 'bigint' ? String(val) : val);

// primitives → inline string (or null if not a handled primitive)
export function inlineFromPrimitive(v: unknown): string | null {
  switch (typeof v) {
    case 'string':  return sanitizeInline(v);
    case 'number':
    case 'boolean':
    case 'bigint':  return String(v);
    case 'symbol':  return sanitizeInline((v.description ?? '').toString());
    case 'function': return '';
    default:        return null;
  }
}

// Date / date-like → inline string (or null)
export function inlineFromDateLike(v: unknown): string | null {
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? '' : sanitizeInline(v.toLocaleString());
  }
  const o = v as { toISOString?: () => string } | null;
  if (o && typeof o.toISOString === 'function') {
    try {
      const d = new Date(o.toISOString());
      return Number.isNaN(d.getTime()) ? '' : sanitizeInline(d.toLocaleString());
    } catch { /* ignore */ }
  }
  return null;
}

// Main helper used by PDF code
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
