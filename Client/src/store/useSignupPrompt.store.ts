import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { safeSet, offlineHint, getStore } from '../helpers/zustandSafe.helper';

export interface TSignupPromptStateType {
  open: boolean;
  email: string | null;
  orderId: number | null;

  error: string | null;
  lastEvent: string | null;
  lastEventAt: number | null;

  openPrompt: (email: string, orderId: number) => void;
  closePrompt: () => void;
  wasPrompted: (email: string) => boolean;
  markPrompted: (email: string) => void;
}

const LOG_PREFIX = 'useSignupPromptStore';
const KEY: string = 'promptedEmails';

function normalizeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const trimmed: string = v.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function record(
  set: (partial: Partial<TSignupPromptStateType>) => void,
  event: string,
  meta?: Record<string, unknown>
): void {
  try {
    const at: number = Date.now();
    set({ lastEvent: event, lastEventAt: at });

  } catch (err) {
    console.error(`${LOG_PREFIX}: telemetry_failed`, err, { event, meta });
  }
}

function readList(): string[] {
  const store: Storage | null = getStore();
  if (!store) return [];
  try {
    const raw: string | null = store.getItem(KEY);
    if (!raw) return [];
    const parsed: any = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e: any): e is string => typeof e === 'string') : [];
  } catch (err) {
    console.warn(`${LOG_PREFIX}: read failed, resetting`, err);
    return [];
  }
}

function writeList(arr: string[]): void {
  const store: Storage | null = getStore();
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify(arr));
  } catch (err) {
    console.error(`${LOG_PREFIX}: write failed`, err, { key: KEY, size: arr.length });
  }
}

export const useSignupPromptStore: UseBoundStore<StoreApi<TSignupPromptStateType>> =
  create<TSignupPromptStateType>((set) => ({
    open: false,
    email: null,
    orderId: null,

    error: null,
    lastEvent: null,
    lastEventAt: null,

    openPrompt: (email: string, orderId: number): void => {
      const normalized: string | null = normalizeEmail(email);
      if (!normalized || !Number.isInteger(orderId) || orderId <= 0) {
        const msg = `Invalid prompt params.${offlineHint()}`;
        console.warn(`${LOG_PREFIX}: openPrompt invalid`, { email, orderId, msg });
        safeSet<TSignupPromptStateType>(set, { error: msg }, LOG_PREFIX);
        record(set, 'signup_prompt:open_invalid', { emailPresent: Boolean(email), orderId });
        return;
      }
      safeSet<TSignupPromptStateType>(set, { open: true, email: normalized, orderId, error: null }, LOG_PREFIX);
      record(set, 'signup_prompt:open', { orderId });
    },

    closePrompt: (): void => {
      safeSet<TSignupPromptStateType>(set, { open: false, email: null, orderId: null }, LOG_PREFIX);
      record(set, 'signup_prompt:close');
    },

    wasPrompted: (email: string): boolean => {
      try {
        const normalized: string | null = normalizeEmail(email);
        if (!normalized) return false;
        return readList().includes(normalized);
      } catch (err) {
        console.error(`${LOG_PREFIX}: wasPrompted threw`, err, { email });
        return false;
      }
    },

    markPrompted: (email: string): void => {
      try {
        const normalized: string | null = normalizeEmail(email);
        if (!normalized) {
          const msg = `Invalid email.${offlineHint()}`;
          safeSet<TSignupPromptStateType>(set, { error: msg }, LOG_PREFIX);
          record(set, 'signup_prompt:mark_invalid');
          return;
        }

        const list: string[] = readList();
        if (!list.includes(normalized)) {
          list.push(normalized);
          writeList(list);
          record(set, 'signup_prompt:marked', { size: list.length });
        } else {
          console.error(`${LOG_PREFIX}: already_marked`, { emailMasked: '***' });
          record(set, 'signup_prompt:already_marked');
        }
      } catch (err) {
        const msg = `Could not persist prompt flag.${offlineHint()}`;
        console.error(`${LOG_PREFIX}: markPrompted threw`, err, { email });
        safeSet<TSignupPromptStateType>(set, { error: msg }, LOG_PREFIX);
        record(set, 'signup_prompt:mark_failed');
      }
    },
  }));
