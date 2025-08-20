import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { safeSet } from '../helpers/zustandSafe.helper';

export interface TThreadModalStateType {
  isOpen: boolean;
  orderId: number | null;

  error: string | null;
  lastEvent: string | null;
  lastEventAt: number | null;

  open: (orderId: number) => void;
  close: () => void;
}

const LOG_PREFIX = 'useThreadModalStore';

function validatePositiveId(id: unknown): number | null {
  const n: number = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function record(
  set: (partial: Partial<TThreadModalStateType>) => void,
  event: string,
  meta?: Record<string, unknown>
): void {
  try {
    const at: number = Date.now();
    set({ lastEvent: event, lastEventAt: at });
    console.debug(`${LOG_PREFIX}: event`, { event, at, ...(meta ?? {}) });
  } catch (err) {
    console.warn(`${LOG_PREFIX}: telemetry_failed`, err, { event, meta });
  }
}

export const useThreadModalStore: UseBoundStore<StoreApi<TThreadModalStateType>> =
  create<TThreadModalStateType>((set) => ({
    isOpen: false,
    orderId: null,

    error: null,
    lastEvent: null,
    lastEventAt: null,

    open: (orderId: number): void => {
      try {
        const id: number | null = validatePositiveId(orderId);
        if (!id) {
          const msg = 'Invalid order id.';
          console.warn(`${LOG_PREFIX}: open invalid`, { orderId, msg });
          safeSet<TThreadModalStateType>(set, { error: msg }, LOG_PREFIX);
          record(set, 'thread_modal:open_invalid', { orderId });
          return;
        }

        safeSet<TThreadModalStateType>(set, { isOpen: true, orderId: id, error: null }, LOG_PREFIX);
        record(set, 'thread_modal:open', { orderId: id });
      } catch (err) {
        console.error(`${LOG_PREFIX}: open threw`, err, { orderId });
        safeSet<TThreadModalStateType>(set, { error: 'Could not open thread modal.' }, LOG_PREFIX);
        record(set, 'thread_modal:open_failed');
      }
    },

    close: (): void => {
      try {
        safeSet<TThreadModalStateType>(set, { isOpen: false, orderId: null }, LOG_PREFIX);
        record(set, 'thread_modal:close');
      } catch (err) {
        console.error(`${LOG_PREFIX}: close threw`, err);
        safeSet<TThreadModalStateType>(set, { isOpen: false, orderId: null }, LOG_PREFIX);
        record(set, 'thread_modal:close_forced');
      }
    },
  }));
