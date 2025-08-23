import {PDFDocument, PDFFont, PDFPage, rgb, StandardFonts} from 'pdf-lib';
import type { OrderInstance } from '../models/order.model.js';
import {
  sanitizeInline,
  layoutRichText,
  drawItemsTable,
  makeDrawLine,
  paintHeaderFooter,
  drawTwoAddressColumns,
  drawOrderIdLine,
  drawRightAlignedPairs,
  drawPageNumbers,
  type ItemRow,
  type TextStyle,
} from '../helpers/pdf.helper.js';
import { money, computeTotals } from '../helpers/money.helper.js';

type Row = [string, string];

export async function generatePdfBuffer(order: OrderInstance): Promise<Buffer> {
  const pdfDoc: PDFDocument = await PDFDocument.create();

  const COLOR_BLACK: [number, number, number] = [0, 0, 0];
  const COLOR_RED:   [number, number, number] = [239/255, 68/255, 68/255]; // #ef4444
  const COLOR_FOOTER:[number, number, number] = [0.4, 0.4, 0.4];
  const COLOR_PGNUM: [number, number, number] = [0.5, 0.5, 0.5];

  const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const SIZE_TITLE = 20;
  const SIZE_SECTION = 14;
  const SIZE_TEXT = 12;
  const SIZE_FOOTER = 10;

  const INCH = 72;
  const HALF_IN = 36;
  const QUARTER_IN = 30;
  const SIDE: 36 = HALF_IN;
  const TOP_CONTENT: 36 = HALF_IN;
  const BOTTOM_CONTENT: 72 = INCH;
  const FOOTER_Y: 30 = QUARTER_IN;

  let page: PDFPage = pdfDoc.addPage();
  const pageRef = { page };
  let { width } = page.getSize();
  const cursor = { y: 0 };
  const contentWidth = width - SIDE * 2;

  const bodyStyle: TextStyle = { font, fontBold, size: SIZE_TEXT, color: COLOR_BLACK };

  const doPaintHeaderFooter: () => void = (): void =>
    paintHeaderFooter({
      pageRef,
      cursor,
      font,
      fontBold,
      sizeTitle: SIZE_TITLE,
      sizeFooter: SIZE_FOOTER,
      side: SIDE,
      topContent: TOP_CONTENT,
      footerY: FOOTER_Y,
      colorBrand: COLOR_BLACK,
      colorSuffix: COLOR_BLACK,
      colorRule: COLOR_RED,
      colorFooter: COLOR_FOOTER,
      brandText: 'One Guy Productions',
      suffixText: ' - Invoice',
      footerMsg:
        'Thank you for working with One Guy Productions. This invoice reflects your order submission details.',
    });

  const newPage: () => void = (): void => {
    page = pdfDoc.addPage();
    pageRef.page = page;
    doPaintHeaderFooter();
    ({ width } = pageRef.page.getSize());
  };

  doPaintHeaderFooter();

  function safe(v: string | number | boolean | Date | null | undefined): string {
    if (v == null) return '';
    if (typeof v === 'string') return sanitizeInline(v);
    if (typeof v === 'number' || typeof v === 'boolean') {
      return String(v);
    }
    return Number.isNaN(v.getTime()) ? '' : sanitizeInline(v.toLocaleString());
  }

  drawTwoAddressColumns({
    pageRef, cursor, newPage, bottom: BOTTOM_CONTENT,
    font, fontBold,
    headingColor: COLOR_RED,
    bodyColor: COLOR_BLACK,
    xLeft: SIDE,
    xRight: SIDE + 260,
    left:  { heading: 'From',   lines: ['One Guy Productions', 'orders@oneguyproductions.com'] },
    right: { heading: 'Bill To', lines: [safe((order as any).name ?? (order as any).customer?.name ?? ''),
        safe((order as any).email ?? (order as any).customer?.email ?? '')] },
  });

  drawOrderIdLine({
    pageRef, cursor, newPage,
    bottom: BOTTOM_CONTENT, side: SIDE,
    font, fontBold,
    size: SIZE_SECTION,
    label: 'Order ID: ',
    value: safe((order as any).id ?? (order as any).orderId ?? ''),
    labelColor: COLOR_RED,
    valueColor: COLOR_BLACK,
    leading: 18,
  });

  const drawLine = makeDrawLine({
    pageRef, cursor, newPage,
    bottom: BOTTOM_CONTENT,
    side: SIDE,
    font, fontBold,
    defaultSize: SIZE_TEXT,
    defaultColor: COLOR_BLACK,
  });

  drawLine(`Customer Name: ${safe((order as any).name ?? (order as any).customer?.name ?? '')}`, { bold: false });
  drawLine(`Email: ${safe((order as any).email ?? (order as any).customer?.email ?? '')}`, { bold: false });
  drawLine(`Business: ${safe((order as any).businessName || 'N/A')}`, { bold: false });
  drawLine(`Submitted: ${safe((order as any).createdAt ? new Date((order as any).createdAt).toLocaleString() : 'Unknown')}`, { bold: false });

  if (cursor.y - (24 + SIZE_SECTION) < BOTTOM_CONTENT) newPage();
  cursor.y -= 24;
  pageRef.page.drawText('Project Details', {
    x: SIDE, y: cursor.y, size: SIZE_SECTION, font: fontBold, color: rgb(...COLOR_RED),
  });
  drawLine(`Project Type: ${safe((order as any).projectType)}`);
  drawLine(`Budget: ${safe((order as any).budget)}`);
  drawLine(`Timeline: ${safe((order as any).timeline)}`);
  drawLine(`Status: ${safe((order as any).status)}`);

  const rows: ItemRow[] = Array.isArray((order as any).items) ? (order as any).items : [];
  if (rows.length > 0) {
    if (cursor.y - (24 + SIZE_SECTION) < BOTTOM_CONTENT) newPage();
    cursor.y -= 24;
    pageRef.page.drawText('Line Items', {
      x: SIDE, y: cursor.y, size: SIZE_SECTION, font: fontBold, color: rgb(...COLOR_RED)
    });

    drawItemsTable(pageRef, {
      cursor, newPage,
      width: contentWidth, left: SIDE, bottom: BOTTOM_CONTENT,
      font, fontBold, rows,
      moneyFn: (cents: number): string => money(cents),
    });

    const { subtotal, discount, tax, shipping, total } = computeTotals(rows, {
      taxRate: Number((order as any).taxRate ?? 0),
      discountCents: Number((order as any).discountCents ?? 0),
      shippingCents: Number((order as any).shippingCents ?? 0),
    });

    const totals: Row[] = [];
    totals.push(['Subtotal', money(subtotal)]);
    if (discount) totals.push(['Discount', `-${money(discount)}`]);
    if (tax) totals.push(['Tax', money(tax)]);
    if (shipping) totals.push(['Shipping', money(shipping)]);
    totals.push(['Total', money(total)]);

    drawRightAlignedPairs({
      pageRef, cursor, newPage,
      bottom: BOTTOM_CONTENT,
      labelX: SIDE + contentWidth - 200,
      valueX: SIDE + contentWidth - 90,
      pairs: totals,
      font, fontBold,
      size: 12,
      leading: 16,
      color: COLOR_BLACK,
    });

    cursor.y -= 10;
  }

  if (cursor.y - (24 + SIZE_SECTION) < BOTTOM_CONTENT) newPage();
  cursor.y -= 24;
  pageRef.page.drawText('Description:', {
    x: SIDE, y: cursor.y, size: SIZE_SECTION, font: fontBold, color: rgb(...COLOR_RED),
  });

  const AFTER_DESC_GAP = 12;
  if (cursor.y - AFTER_DESC_GAP < BOTTOM_CONTENT) newPage();
  cursor.y -= AFTER_DESC_GAP;

  layoutRichText({
    pageRef,
    newPage,
    cursor,
    x: SIDE,
    contentWidth,
    bottomContentMargin: BOTTOM_CONTENT,
    lineHeight: 16,
    paraGap: 16,
    style: bodyStyle,
    text: String((order as any).description || ''),
  });

  drawPageNumbers({
    pdfDoc,
    font,
    size: SIZE_FOOTER,
    side: SIDE,
    footerY: FOOTER_Y,
    color: COLOR_PGNUM,
  });

  const bytes: Uint8Array<ArrayBufferLike> = await pdfDoc.save();
  return Buffer.from(bytes);
}
