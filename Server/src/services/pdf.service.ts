// Server/src/services/pdf.service.ts
import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import type { OrderInstance } from '../models/order.model.js';
import {
  sanitizeInline,
  layoutRichText,
  drawItemsTable,
  makeDrawLine,
  // drawTwoAddressColumns, // not used; we render columns manually to control spacing
  drawRightAlignedPairs,
  drawPageNumbers,
  drawLogo,
  type ItemRow,
  type TaskRow,
} from '../helpers/pdf.helper.js';
import { money, computeTotals } from '../helpers/money.helper.js';

export async function generatePdfBuffer(order: OrderInstance): Promise<Buffer> {
  const pdfDoc: PDFDocument = await PDFDocument.create();

  // Fonts (Helvetica 12pt baseline everywhere)
  const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page + constants
  const page = pdfDoc.addPage([612, 792]); // Letter portrait
  const SIDE = 48;
  const contentWidth = page.getSize().width - SIDE * 2;
  const TOP = page.getSize().height - SIDE;
  const BOTTOM = 64;

  const drawLineRaw = makeDrawLine(page);
  // Only draw header underline (0.5); skip per-row separators (0.25)
  const drawHeaderOnly = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5) => {
    if ((thickness ?? 0.5) >= 0.5) {
      drawLineRaw(x1, y1, x2, y2, thickness);
    }
  };

  // Safe accessor
  function safe(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return sanitizeInline(v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      // @ts-ignore
      if (v && typeof v.toISOString === 'function') {
        return sanitizeInline(new Date(v as any).toLocaleString());
      }
    } catch { /* no-throw */ }
    return sanitizeInline(String(v ?? ''));
  }

  // Deserialize items/tasks
  const items: ItemRow[] = Array.isArray((order as any).items) ? (order as any).items : [];
  const tasks: TaskRow[] = Array.isArray((order as any).tasks) ? (order as any).tasks : [];

  // Totals
  const totals = computeTotals(items, {
    taxRate: Number((order as any).taxRate ?? 0),
    discountCents: Number((order as any).discountCents ?? 0),
    shippingCents: Number((order as any).shippingCents ?? 0),
  });

  // Header rule
  drawLineRaw(SIDE, TOP - 56, SIDE + contentWidth, TOP - 56, 0.8);

  // Optional logo
  try {
    const logoB64: string | undefined =
      (order as any).logoBase64 || (order as any).companyLogoBase64 || undefined;
    if (logoB64) {
      const bytes = Buffer.from(logoB64.split(',').pop() ?? '', 'base64');
      const img = await pdfDoc.embedPng(bytes).catch(async () => {
        try { return await pdfDoc.embedJpg(bytes); } catch { return null; }
      });
      drawLogo(page, img, SIDE, TOP - 12, 160, 44);
    }
  } catch { /* no-throw */ }

  // Big total on the top-right — color red-500 (#ef4444) + black "Amount Due:" label to its left
  try {
    const totalText = money(totals.total);
    const totalSize = 20;
    const totalTextWidth = fontBold.widthOfTextAtSize(totalText, totalSize);

    // X position where the red total starts (right aligned to content edge)
    const xTotal = SIDE + contentWidth - totalTextWidth;
    const yTotal = TOP - 30;

    // Draw the black label aligned to the left of the red total with a small gap
    const labelText = 'Amount Due:';
    const labelSize = 25;
    const labelWidth = font.widthOfTextAtSize(labelText, labelSize);
    const gap = 8; // space between label and total
    const xLabel = xTotal - gap - labelWidth;

    page.drawText(labelText, {
      x: xLabel,
      y: yTotal,
      size: labelSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Draw the red total
    page.drawText(totalText, {
      x: xTotal,
      y: yTotal,
      size: totalSize,
      font: fontBold,
      color: rgb(239 / 255, 68 / 255, 68 / 255),
    });

    // ── NEW: small gray Invoice Date directly under the total (MM,DD,YYYY), right-aligned
    const invoiceDate: Date = (order as any).invoiceCreatedAt
      ? new Date((order as any).invoiceCreatedAt)
      : new Date();
    const mm = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const dd = String(invoiceDate.getDate()).padStart(2, '0');
    const yyyy = invoiceDate.getFullYear();
    const mdy = `${mm}-${dd}-${yyyy}`;

    const dateLabel = `Invoice Date: ${mdy}`;
    const dateSize = 10;
    const dateWidth = font.widthOfTextAtSize(dateLabel, dateSize);
    const xDate = SIDE + contentWidth - dateWidth; // right align with the total
    const yDate = yTotal - 14;                     // sit neatly below, above the header rule

    page.drawText(dateLabel, {
      x: xDate,
      y: yDate,
      size: dateSize,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
  } catch { /* no-throw */ }

  // Invoice meta (left side): keep invoice number; no order date
  const createdAt = (order as any).createdAt ? new Date((order as any).createdAt) : new Date();
  const invNum: string =
    (order as any).invoiceNumber ??
    `INV-${createdAt.getFullYear()}-${String((order as any).id ?? '0000').padStart(4, '0')}`;

  try {
    page.drawText(`Invoice #: ${invNum}`, { x: SIDE, y: TOP - 78, size: 12, font, color: rgb(0, 0, 0) });
  } catch { /* no-throw */ }

  // ─────────────────────────────────────────────────────────────
  // Address columns (Customer | One Guy Productions)
  // ─────────────────────────────────────────────────────────────
  const colWidth = Math.floor(contentWidth / 2 - 12);
  const gap = 24;
  const xLeft = SIDE;
  const xRight = SIDE + colWidth + gap;

  // Headings (12pt)
  try {
    page.drawText('Customer', { x: xLeft, y: TOP - 104, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('One Guy Productions', { x: xRight, y: TOP - 104, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  } catch { /* no-throw */ }

  // LEFT: DB-derived lines — one per line; Submitted shows date only
  const customerLines: string[] = [
    `Customer Name: ${safe((order as any).name ?? (order as any).customer?.name ?? '')}`,
    `Email: ${safe((order as any).email ?? (order as any).customer?.email ?? '')}`,
    `Business: ${safe((order as any).businessName || 'N/A')}`,
    `Submitted: ${safe((order as any).createdAt ? new Date((order as any).createdAt).toLocaleDateString() : 'Unknown')}`,
  ];

  // RIGHT: fixed company lines
  const ogpLines: string[] = [
    'ngreen@oneguyproductions.com',
    '338 Paddington Drive',
    'Kyle, TX 78640',
    '512-787-0879',
  ];

  // Helper: draw a column with guaranteed line breaks + row padding
  function drawLinesColumn(
    x: number,
    yStart: number,
    lines: string[],
    maxWidth: number,
    size = 12,
    lineWrapGap = 2,
    rowGap = 12
  ): number {
    const style = { font, size, color: { r: 0, g: 0, b: 0 } };
    let yCursor = yStart;
    for (const ln of lines) {
      yCursor = layoutRichText(page, ln, x, yCursor, maxWidth, style, lineWrapGap);
      yCursor -= rowGap;
    }
    return yCursor;
  }

  const yColTop = TOP - 120;
  const yLeftEnd = drawLinesColumn(xLeft, yColTop, customerLines, colWidth, 12, 2, 12);
  const yRightEnd = drawLinesColumn(xRight, yColTop, ogpLines, colWidth, 12, 2, 14);

  // Start content below the lower of the two columns, with an extra blank line
  let y = Math.min(yLeftEnd, yRightEnd) - 24;

  // Optional TASKS section
  if (tasks.length > 0) {
    y = drawItemsTable({
      page,
      font,
      fontBold,
      xLeft: SIDE,
      yTop: y,
      width: contentWidth,
      rows: tasks.map((t) => ({
        description: `${sanitizeInline(String(t.task || 'Task'))} (${Math.max(0, Number(t.hours) || 0)}h @ $${(Math.max(0, Number(t.rateCents) || 0) / 100).toFixed(2)}/h)`,
        quantity: Math.max(0, Number(t.hours) || 0),
        unitPriceCents: Math.max(0, Number(t.rateCents) || 0),
      })),
      line: drawHeaderOnly,
      header: 'Task',
    }) - 8;
  }

  // Items section (12pt via helper)
  y = drawItemsTable({
    page,
    font,
    fontBold,
    xLeft: SIDE,
    yTop: y,
    width: contentWidth,
    rows: items,
    line: drawHeaderOnly,
    header: 'Item',
  });

  // Terms & Remarks (12pt)
  const terms = safe((order as any).termsText || 'Net 30');
  const remarks = safe((order as any).notesText || 'Thanks for choosing One Guy Productions! Please think of us for your next project.');
  const bodyStyle12 = { font, size: 12, color: { r: 0, g: 0, b: 0 } };

  try {
    const termsLabelY = y - 10;
    page.drawText('Terms', { x: SIDE, y: termsLabelY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    layoutRichText(page, terms, SIDE, termsLabelY - 16, Math.floor(contentWidth / 2 - 24), bodyStyle12, 4);

    const remarksY = termsLabelY - 56;
    page.drawText('Remarks', { x: SIDE, y: remarksY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    layoutRichText(page, remarks, SIDE, remarksY - 16, Math.floor(contentWidth / 2 - 24), bodyStyle12, 4);
  } catch { /* no-throw */ }

  // Footer line
  drawLineRaw(SIDE, BOTTOM, SIDE + contentWidth, BOTTOM, 0.6);

  // Totals block: lower-right, above footer (12pt)
  const pairs = [
    { label: 'Subtotal', value: money(totals.subtotal) },
    ...(totals.discount ? [{ label: 'Discount', value: `-${money(totals.discount)}` }] : []),
    ...(totals.tax ? [{ label: 'Tax', value: money(totals.tax) }] : []),
    ...(totals.shipping ? [{ label: 'Shipping', value: money(totals.shipping) }] : []),
    { label: 'Total', value: money(totals.total), bold: true },
  ];
  const rowsCount = pairs.length;
  const rowGap = 16;
  const startY = BOTTOM + 12 + (rowsCount - 1) * rowGap; // last line lands just above the footer
  drawRightAlignedPairs(page, font, fontBold, SIDE + contentWidth, startY, pairs, 12, rowGap);

  // Page numbers
  drawPageNumbers(page, font, 0, 1, SIDE + contentWidth, BOTTOM - 14);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
