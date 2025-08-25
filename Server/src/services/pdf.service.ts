import {PDFDocument, PDFFont, PDFImage, PDFPage, rgb, StandardFonts} from 'pdf-lib';
import type { OrderInstance } from '../models/order.model.js';
import {
  sanitizeInline,
  layoutRichText,
  drawItemsTable,
  makeDrawLine,
  drawRightAlignedPairs,
  drawPageNumbers,
  drawLogo,
  type ItemRow,
  type TaskRow,
  pdfSafeString as safe,
} from '../helpers/pdf.helper.js';
import { money, computeTotals } from '../helpers/money.helper.js';

export async function generatePdfBuffer(order: OrderInstance): Promise<Buffer> {
  const pdfDoc: PDFDocument = await PDFDocument.create();

  const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page: PDFPage = pdfDoc.addPage([612, 792]);
  const SIDE = 48;
  const contentWidth: number = page.getSize().width - SIDE * 2;
  const TOP: number = page.getSize().height - SIDE;
  const BOTTOM = 64;

  const drawLineRaw = makeDrawLine(page);
  const drawHeaderOnly = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5): void => {
    if ((thickness ?? 0.5) >= 0.5) {
      drawLineRaw(x1, y1, x2, y2, thickness);
    }
  };

  const items: ItemRow[] = Array.isArray((order as any).items) ? (order as any).items : [];
  const tasks: TaskRow[] = Array.isArray((order as any).tasks) ? (order as any).tasks : [];

  const totals = computeTotals(items, {
    taxRate: Number((order as any).taxRate ?? 0),
    discountCents: Number((order as any).discountCents ?? 0),
    shippingCents: Number((order as any).shippingCents ?? 0),
  });

  drawLineRaw(SIDE, TOP - 56, SIDE + contentWidth, TOP - 56, 0.8);

  try {
    const logoB64: string | undefined =
      (order as any).logoBase64 || (order as any).companyLogoBase64 || undefined;
    if (logoB64) {
      const bytes: Buffer<ArrayBuffer> = Buffer.from(logoB64.split(',').pop() ?? '', 'base64');
      const img: PDFImage | null = await pdfDoc.embedPng(bytes).catch(async (): Promise<PDFImage | null> => {
        try { return await pdfDoc.embedJpg(bytes); } catch { return null; }
      });
      drawLogo(page, img, SIDE, TOP - 12, 160, 44);
    }
  } catch {  }

  try {
    const totalText: string = money(totals.total);
    const totalSize = 20;
    const totalTextWidth: number = fontBold.widthOfTextAtSize(totalText, totalSize);

    const xTotal: number = SIDE + contentWidth - totalTextWidth;
    const yTotal: number = TOP - 30;

    const labelText = 'Amount Due:';
    const labelSize = 25;
    const labelWidth: number = font.widthOfTextAtSize(labelText, labelSize);
    const gap = 8;
    const xLabel: number = xTotal - gap - labelWidth;

    page.drawText(labelText, {
      x: xLabel,
      y: yTotal,
      size: labelSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(totalText, {
      x: xTotal,
      y: yTotal,
      size: totalSize,
      font: fontBold,
      color: rgb(239 / 255, 68 / 255, 68 / 255),
    });

    const invoiceDate: Date = (order as any).invoiceCreatedAt
      ? new Date((order as any).invoiceCreatedAt)
      : new Date();
    const mm: string = String(invoiceDate.getMonth() + 1).padStart(2, '0');
    const dd: string = String(invoiceDate.getDate()).padStart(2, '0');
    const yyyy: number = invoiceDate.getFullYear();
    const mdy = `${mm}-${dd}-${yyyy}`;

    const dateLabel = `Invoice Date: ${mdy}`;
    const dateSize = 10;
    const dateWidth: number = font.widthOfTextAtSize(dateLabel, dateSize);
    const xDate: number = SIDE + contentWidth - dateWidth;
    const yDate: number = yTotal - 14;

    page.drawText(dateLabel, {
      x: xDate,
      y: yDate,
      size: dateSize,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });
  } catch {  }

  const createdAt: Date = (order as any).createdAt ? new Date((order as any).createdAt) : new Date();
  const invNum: string =
    (order as any).invoiceNumber ??
    `INV-${createdAt.getFullYear()}-${String((order as any).id ?? '0000').padStart(4, '0')}`;

  try {
    page.drawText(`Invoice #: ${invNum}`, { x: SIDE, y: TOP - 78, size: 12, font, color: rgb(0, 0, 0) });
  } catch {  }

  const colWidth: number = Math.floor(contentWidth / 2 - 12);
  const gap = 24;
  const xLeft: 48 = SIDE;
  const xRight: number = SIDE + colWidth + gap;

  try {
    page.drawText('Customer', { x: xLeft, y: TOP - 104, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('One Guy Productions', { x: xRight, y: TOP - 104, size: 12, font: fontBold, color: rgb(0, 0, 0) });
  } catch {  }

  const customerLines: string[] = [
    `Customer Name: ${safe((order as any).name ?? (order as any).customer?.name ?? '')}`,
    `Email: ${safe((order as any).email ?? (order as any).customer?.email ?? '')}`,
    `Business: ${safe((order as any).businessName || 'N/A')}`,
    `Submitted: ${safe((order as any).createdAt ? new Date((order as any).createdAt).toLocaleDateString() : 'Unknown')}`,
  ];

  const ogpLines: string[] = [
    'ngreen@oneguyproductions.com',
    'Paddington Drive',
    'Kyle, TX 78640',
    '512-787-0879',
  ];

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
    let yCursor: number = yStart;
    for (const ln of lines) {
      yCursor = layoutRichText(page, ln, x, yCursor, maxWidth, style, lineWrapGap);
      yCursor -= rowGap;
    }
    return yCursor;
  }

  const yColTop: number = TOP - 120;
  const yLeftEnd: number = drawLinesColumn(xLeft, yColTop, customerLines, colWidth, 12, 2, 12);
  const yRightEnd: number = drawLinesColumn(xRight, yColTop, ogpLines, colWidth, 12, 2, 14);

  let y = Math.min(yLeftEnd, yRightEnd) - 24;

  if (tasks.length > 0) {
    y = drawItemsTable({
      page,
      font,
      fontBold,
      xLeft: SIDE,
      yTop: y,
      width: contentWidth,
      rows: tasks.map((t: TaskRow) => ({
        description: `${sanitizeInline(String(t.task || 'Task'))} (${Math.max(0, Number(t.hours) || 0)}h @ $${(Math.max(0, Number(t.rateCents) || 0) / 100).toFixed(2)}/h)`,
        quantity: Math.max(0, Number(t.hours) || 0),
        unitPriceCents: Math.max(0, Number(t.rateCents) || 0),
      })),
      line: drawHeaderOnly,
      header: 'Task',
    }) - 8;
  }

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

  const terms: string = safe((order as any).termsText || 'Net 30');
  const remarks: string = safe((order as any).notesText || 'Thanks for choosing One Guy Productions! Please think of us for your next project.');
  const bodyStyle12 = { font, size: 12, color: { r: 0, g: 0, b: 0 } };

  try {
    const termsLabelY: number = y - 10;
    page.drawText('Terms', { x: SIDE, y: termsLabelY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    layoutRichText(page, terms, SIDE, termsLabelY - 16, Math.floor(contentWidth / 2 - 24), bodyStyle12, 4);

    const remarksY: number = termsLabelY - 56;
    page.drawText('Remarks', { x: SIDE, y: remarksY, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    layoutRichText(page, remarks, SIDE, remarksY - 16, Math.floor(contentWidth / 2 - 24), bodyStyle12, 4);
  } catch {  }

  drawLineRaw(SIDE, BOTTOM, SIDE + contentWidth, BOTTOM, 0.6);

  const pairs = [
    { label: 'Subtotal', value: money(totals.subtotal) },
    ...(totals.discount ? [{ label: 'Discount', value: `-${money(totals.discount)}` }] : []),
    ...(totals.tax ? [{ label: 'Tax', value: money(totals.tax) }] : []),
    ...(totals.shipping ? [{ label: 'Shipping', value: money(totals.shipping) }] : []),
    { label: 'Total', value: money(totals.total), bold: true },
  ];
  const rowsCount: number = pairs.length;
  const rowGap = 16;
  const startY: number = BOTTOM + 12 + (rowsCount - 1) * rowGap;
  drawRightAlignedPairs({
    page,
    font,
    fontBold,
    xRight: SIDE + contentWidth,
    startY,
    rows: pairs,
    size: 12,
    rowGap,
  });


  drawPageNumbers(page, font, 0, 1, SIDE + contentWidth, BOTTOM - 14);

  const bytes:Uint8Array<ArrayBufferLike> = await pdfDoc.save();
  return Buffer.from(bytes);
}
