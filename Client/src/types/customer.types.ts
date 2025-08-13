import type { UpdateEventType, UpdateSource, ISODateString } from './dto.types';

export interface CustomerThreadUpdate {
  id: number;
  orderId: number;
  authorUserId: number | null;
  authorEmail: string | null;
  body: string;
  source: UpdateSource;
  eventType: UpdateEventType;
  requiresCustomerResponse: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type CustomerThread = CustomerThreadUpdate[];
