import type {OrderStatus} from "./order.types.ts";
import type {AdminOrderRowDto} from "./admin.types.ts";

export type TSafeFetchResultType<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type TAdminOrdersParamsType = {
  q?: string;
  status?: OrderStatus | 'all';
  assigned?: 'me' | 'any';
  updatedWithin?: '24h' | '7d' | '30d' | 'all';
  page?: number;
  pageSize?: number;
};

export type TAdminOrdersDataType = {
  rows: AdminOrderRowDto[];
  total: number;
};