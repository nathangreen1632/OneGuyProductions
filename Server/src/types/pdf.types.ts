import type { PDFFont, PDFPage } from 'pdf-lib';

export type TTextStyleType = Readonly<{
  size: number;
  font: PDFFont;
  color?: { r: number; g: number; b: number };
  opacity?: number;
}>;

export type TItemRowType = Readonly<{
  description: string;
  quantity: number;
  unitPriceCents: number;
}>;

export type TTaskRowType = Readonly<{
  task: string;
  rateCents: number;
  hours: number;
}>;

export type TRightPairsRowType = Readonly<{
  label: string;
  value: string;
  bold?: boolean;
}>;

export type TDrawLineFnType = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness?: number
) => void;

export type TDrawRightAlignedPairsOptsType = Readonly<{
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  xRight: number;
  startY: number;
  rows: ReadonlyArray<TRightPairsRowType>;
  size?: number;
  rowGap?: number;
  labelColumnWidth?: number;
}>;

export type TDrawItemsTableOptsType = Readonly<{
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  xLeft: number;
  yTop: number;
  width: number;
  rows: ReadonlyArray<TItemRowType>;
  line: TDrawLineFnType;
  header?: string;
}>;

