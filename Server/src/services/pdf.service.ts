import {
  createPdfCtx,
  embedLogoFromOrderOrEnv,
  drawAmountDueAndDate,
  drawInvoiceNumber,
  drawTwoColumnsBlock,
  drawTasksAndItems,
  drawTermsAndRemarks,
  drawTotalsBlock,
  pdfSafeString as safe,
  type ItemRow, type TaskRow, PdfCtx,
} from '../helpers/pdf.helper.js';
import { computeTotals } from '../helpers/money.helper.js';
import {OrderInstance} from "../models/order.model.js";

export async function generatePdfBuffer(order: OrderInstance): Promise<Buffer> {
  const ctx: PdfCtx = await createPdfCtx();
  const {page, font, fontBold, SIDE, TOP, BOTTOM, contentWidth, drawLineRaw, drawHeaderOnly } = ctx;

  const items: ItemRow[] = Array.isArray((order as any).items) ? (order as any).items : [];
  const tasks: TaskRow[] = Array.isArray((order as any).tasks) ? (order as any).tasks : [];

  const totals: {subtotal: number; discount: number; tax: number; shipping: number; total: number} = computeTotals(items, {
    taxRate: Number((order as any).taxRate ?? 0),
    discountCents: Number((order as any).discountCents ?? 0),
    shippingCents: Number((order as any).shippingCents ?? 0),
  });

  drawLineRaw(SIDE, TOP - 56, SIDE + contentWidth, TOP - 56, 0.8);

  await embedLogoFromOrderOrEnv({ ctx, orderLike: order });

  drawAmountDueAndDate({ ctx, totalCents: totals.total, invoiceCreatedAt: (order as any).invoiceCreatedAt });

  const createdAt: Date = (order as any).createdAt ? new Date((order as any).createdAt) : new Date();
  const invNum: string =
    (order as any).invoiceNumber ??
    `INV-${createdAt.getFullYear()}-${String((order as any).id ?? '0000').padStart(4, '0')}`;
  drawInvoiceNumber({ ctx, invNum });

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
  let y: number = drawTwoColumnsBlock({ ctx, customerLines, companyLines: ogpLines });

  y = drawTasksAndItems({ ctx, yStart: y, tasks, items, drawHeaderOnly });

  const terms: string = safe((order as any).termsText || 'Net 30');
  const remarks: string = safe((order as any).notesText || 'Thanks for choosing One Guy Productions! Please think of us for your next project.');
  drawTermsAndRemarks({ ctx, yStart: y, terms, remarks });

  drawTotalsBlock(page, font, fontBold, SIDE, BOTTOM, contentWidth, totals);
  try {
    const { drawPageNumbers } = await import('../helpers/pdf.helper.js');
    drawPageNumbers(page, font, 0, 1, SIDE + contentWidth, BOTTOM - 14);
  } catch {}

  const bytes: Uint8Array<ArrayBufferLike> = await (ctx.pdfDoc).save();
  return Buffer.from(bytes);
}
