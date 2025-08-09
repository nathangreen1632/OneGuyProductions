import {PDFDocument, PDFFont, rgb, StandardFonts} from 'pdf-lib';
import type { OrderInstance } from '../models/order.model.js';

/**
 * Generates a PDF invoice buffer for a given order using pdf-lib.
 */
export async function generatePdfBuffer(order: OrderInstance): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const fontSizeTitle = 20;
  const fontSizeSection = 14;
  const fontSizeText = 12;
  const lineHeight = 18;

  const margin = 50;
  let cursorY: number = height - margin;

  const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, opts: { bold?: boolean; yOffset?: number; size?: number; color?: [number, number, number] } = {}): void => {
    const {
      bold = false,
      yOffset = lineHeight,
      size = fontSizeText,
      color = [0, 0, 0],
    } = opts;
    cursorY -= yOffset;
    page.drawText(text, {
      x: margin,
      y: cursorY,
      size,
      font: bold ? fontBold : font,
      color: rgb(...color),
    });
  };

  // Header
  drawText('OneGuyProductions — Invoice', {
    bold: true,
    size: fontSizeTitle,
    color: [0.2, 0.2, 0.2],
    yOffset: 0,
  });

  cursorY -= 30;

  // Basic Info
  drawText(`Order ID: ${order.id}`);
  drawText(`Customer Name: ${order.name}`);
  drawText(`Email: ${order.email}`);
  drawText(`Business: ${order.businessName || 'N/A'}`);
  drawText(`Submitted: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown'}`);

  cursorY -= 20;
  drawText('Project Details', { bold: true, size: fontSizeSection });
  drawText(`Project Type: ${order.projectType}`);
  drawText(`Budget: ${order.budget}`);
  drawText(`Timeline: ${order.timeline}`);
  drawText(`Status: ${order.status}`);

  cursorY -= 20;
  drawText('Description:', { bold: true });

  // Description text wrap
  const description = order.description || '';
  const maxLineWidth = width - margin * 2;
  const words = description.split(' ');
  let line = '';

  for (const word of words) {
    const testLine = line + word + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, fontSizeText);
    if (testWidth > maxLineWidth) {
      drawText(line.trim(), { size: fontSizeText, yOffset: 14 });
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  if (line) drawText(line.trim(), { size: fontSizeText, yOffset: 14 });

  // Footer
  cursorY -= 40;
  drawText(
    'Thank you for working with OneGuyProductions. This invoice reflects your order submission details.',
    { size: 10, color: [0.4, 0.4, 0.4] }
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
