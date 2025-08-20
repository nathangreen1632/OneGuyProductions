import { create, type StoreApi, type UseBoundStore } from 'zustand';

type ResetStep = 'request' | 'verify';

interface ResetPasswordState {
  modalOpen: boolean;
  step: ResetStep;
  loading: boolean;
  email: string;

  error: string | null;
  lastEvent: string | null;
  lastEventAt: number | null;

  setEmail: (email: string) => void;
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: ResetStep) => void;
  setLoading: (value: boolean) => void;

  setError: (message: string | null, meta?: Record<string, unknown>) => void;
  recordEvent: (event: string, meta?: Record<string, unknown>) => void;

  reset: () => void;
}

const LOG_PREFIX = 'useResetPasswordStore';

function safeSet<S>(
  set: (partial: Partial<S> | ((state: S) => Partial<S>)) => void,
  partial: Partial<S> | ((state: S) => Partial<S>),
  context?: { event?: string; meta?: Record<string, unknown> }
): void {
  try {
    set(partial);

  } catch (err) {
    console.error(`${LOG_PREFIX}: set() failed`, err, { partial, context });
    try {
      set((s: any) => ({
        ...(s ?? {}),
        error: 'State update failed',
      }));
    } catch {

    }
  }
}

export const useResetPasswordStore: UseBoundStore<StoreApi<ResetPasswordState>> =
  create<ResetPasswordState>((set) => {
    const record: (event: string, meta?: Record<string, unknown>) => void = (event: string, meta?: Record<string, unknown>): void => {
      try {
        const at: number = Date.now();
        set({
          lastEvent: event,
          lastEventAt: at,
        });
        console.debug(`${LOG_PREFIX}: event`, { event, at, ...(meta ?? {}) });
      } catch (err) {
        console.warn(`${LOG_PREFIX}: telemetry_failed`, err, { event, meta });
      }
    };

    return {
      modalOpen: false,
      step: 'request',
      loading: false,
      email: '',

      error: null,
      lastEvent: null,
      lastEventAt: null,

      setEmail: (email: string): void => {
        safeSet<ResetPasswordState>(
          set,
          { email, error: null },
          { event: 'reset_password:set_email', meta: { emailMasked: email ? '***' : '' } }
        );
        record('reset_password:set_email', { emailPresent: Boolean(email) });
      },

      openModal: (): void => {
        safeSet<ResetPasswordState>(
          set,
          { modalOpen: true, error: null },
          { event: 'reset_password:open_modal' }
        );
        record('reset_password:open_modal');
      },

      closeModal: (): void => {
        safeSet<ResetPasswordState>(
          set,
          { modalOpen: false, loading: false },
          { event: 'reset_password:close_modal' }
        );
        record('reset_password:close_modal');
      },

      setStep: (step: ResetStep): void => {
        const next: ResetStep = step === 'verify' ? 'verify' : 'request';
        safeSet<ResetPasswordState>(
          set,
          { step: next, error: null },
          { event: 'reset_password:set_step', meta: { step: next } }
        );
        record('reset_password:set_step', { step: next });
      },

      setLoading: (value: boolean): void => {
        safeSet<ResetPasswordState>(
          set,
          { loading: value },
          { event: 'reset_password:set_loading', meta: { loading: value } }
        );
        record('reset_password:set_loading', { loading: value });
      },

      setError: (message: string | null, meta?: Record<string, unknown>): void => {
        try {
          if (message) {
            console.warn(`${LOG_PREFIX}: error`, { message, ...(meta ?? {}) });
          }
          safeSet<ResetPasswordState>(
            set,
            { error: message },
            { event: 'reset_password:set_error', meta: { hasError: Boolean(message), ...(meta ?? {}) } }
          );
          record('reset_password:set_error', { hasError: Boolean(message) });
        } catch (err) {
          console.error(`${LOG_PREFIX}: setError failed`, err, { message, meta });
        }
      },

      recordEvent: (event: string, meta?: Record<string, unknown>): void => {
        record(event, meta);
      },

      reset: (): void => {
        safeSet<ResetPasswordState>(
          set,
          {
            modalOpen: false,
            step: 'request',
            loading: false,
            email: '',
            error: null,
          },
          { event: 'reset_password:reset' }
        );
        record('reset_password:reset');
      },
    };
  });
