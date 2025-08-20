import React, {type RefObject, useEffect, useRef, useState} from 'react';
import toast from 'react-hot-toast';
import TimelineEditModal from './TimelineEditModal';
import { useResetPasswordStore } from '../store/useResetPassword.store';
import { type ApiErrorBody, readJsonSafe, isNonEmptyString } from '../helpers/http.helper';

type TResetStep = 'request' | 'verify';

const LOG_PREFIX = 'ResetPasswordModal';

function isValidEmail(v: string): boolean {
  const s: string = v.trim();
  const at: number = s.indexOf('@');
  if (at <= 0 || at !== s.lastIndexOf('@')) return false;

  const local: string = s.slice(0, at);
  const domain: string = s.slice(at + 1);
  if (local.length === 0 || domain.length < 3) return false;
  if (domain.indexOf('.') === -1) return false;

  if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;

  const lastDot: number = domain.lastIndexOf('.');
  if (lastDot < 1 || lastDot === domain.length - 1) return false;

  const tld: string = domain.slice(lastDot + 1);
  return /^[A-Za-z]{2,}$/.test(tld);
}

function errorMessageFromStatus(res: Response, body: ApiErrorBody | null, context: string): string {
  if (body?.error && isNonEmptyString(body.error)) return body.error;
  if (body?.message && isNonEmptyString(body.message)) return body.message;

  if (res.status >= 500) return `Server error while ${context}.`;
  if (res.status === 429) return `Too many attempts. Please wait a moment and try again.`;
  if (res.status === 404) return `We couldn't find an account with that email.`;
  if (res.status === 401 || res.status === 403) return `You don't have permission to perform this action.`;
  if (res.status === 400) return `The request was invalid. Please check the fields and try again.`;
  return `Request failed while ${context}.`;
}

export default function ResetPasswordModal(): React.ReactElement | null {
  const {
    modalOpen,
    step,
    setStep,
    email,
    setEmail,
    loading,
    setLoading,
    reset,
  }: {
    modalOpen: boolean;
    step: TResetStep;
    setStep: (s: TResetStep) => void;
    email: string;
    setEmail: (v: string) => void;
    loading: boolean;
    setLoading: (v: boolean) => void;
    reset: () => void;
  } = useResetPasswordStore();

  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const isMountedRef: RefObject<boolean> = useRef(true);

  useEffect((): () => void => {
    isMountedRef.current = true;
    return (): void => { isMountedRef.current = false; };
  }, []);

  const controllerRef: RefObject<AbortController | null> = useRef<AbortController | null>(null);
  const abortInFlight: () => void = (): void => {
    try {
      controllerRef.current?.abort();
    } catch (err) {
      console.warn(`${LOG_PREFIX}: abort controller failed`, err);
    } finally {
      controllerRef.current = null;
    }
  };

  useEffect((): void => {
    if (!modalOpen) {
      abortInFlight();
      setOtp('');
      setNewPassword('');
      setConfirm('');
      setEmail('');
      setStep('request');
    }
  }, [modalOpen, setEmail, setStep]);

  const handleRequestOtp: () => Promise<void> = async (): Promise<void> => {
    if (loading) return;

    const trimmedEmail: string = email.trim();
    if (!isNonEmptyString(trimmedEmail)) {
      toast.error('Please enter your email.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      toast.error('That email address looks invalid.');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res: Response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
        signal: controller.signal,
      });

      const body: ApiErrorBody | null = await readJsonSafe(res);

      function maskEmail(email: string): string {
        const s: string = email.trim();
        const at: number = s.indexOf('@');
        if (at <= 0) return s;

        const first: string = s[0];
        const tail: string = s.slice(at);
        const midLen: number = Math.max(1, at - 1);
        return `${first}${'*'.repeat(midLen)}${tail}`;
      }

      if (res.ok) {
        const masked: string = maskEmail(trimmedEmail);
        toast.success(`One‑time code sent to ${masked}. Check your inbox (and spam folder).`);
        setStep('verify');

        toast.success(`One‑time code sent to ${masked}. Check your inbox (and spam folder).`);
        setStep('verify');
      } else {
        const msg: string = errorMessageFromStatus(res, body, 'sending the one‑time code');
        toast.error(msg);
        console.warn(`${LOG_PREFIX}: request-otp failed`, { status: res.status, msg, body });
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        console.info(`${LOG_PREFIX}: request-otp aborted`);
        return;
      }
      console.error(`${LOG_PREFIX}: network/unexpected error on request-otp`, err);
      const offlineHint: ' You appear to be offline.' | '' =
        typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator).onLine === false
          ? ' You appear to be offline.'
          : '';
      toast.error(`Unable to contact the server.${offlineHint}`);
    } finally {
      if (isMountedRef.current) setLoading(false);
      controllerRef.current = null;
    }
  };

  function validateVerifyInputs(codeRaw: string, newPw: string, confirmPw: string): string | null {
    const code: string = codeRaw.trim();
    const isSixDigits: boolean = code.length === 6 && [...code].every(ch => ch >= '0' && ch <= '9');
    if (!isSixDigits) return 'Your one‑time code must be 6 digits.';
    if (!isNonEmptyString(newPw)) return 'Please enter a new password.';
    if (newPw.length < 8) return 'Password must be at least 8 characters.';
    if (newPw !== confirmPw) return 'Passwords do not match.';
    return null;
  }

  async function submitVerifyOtp(
    email: string,
    code: string,
    newPassword: string,
    signal: AbortSignal
  ): Promise<{ res: Response; body: ApiErrorBody | null }> {
    const res: Response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), otp: code.trim(), newPassword }),
      signal,
    });
    const body: ApiErrorBody | null = await readJsonSafe(res);
    return { res, body };
  }

  function offlineHint(): string {
    try {
      return typeof navigator !== 'undefined' && 'onLine' in navigator && (navigator).onLine === false
        ? ' You appear to be offline.'
        : '';
    } catch {
      return '';
    }
  }


  const handleVerifyOtp: () => Promise<void> = async (): Promise<void> => {
    if (loading) return;

    const validationError: string | null = validateVerifyInputs(otp, newPassword, confirm);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const { res, body } = await submitVerifyOtp(email, otp, newPassword, controller.signal);

      if (res.ok) {
        toast.success('Your password has been reset. You can now sign in with the new password.');
        try {
          reset();
        } catch (err) {
          console.error(`${LOG_PREFIX}: reset() threw after success`, err);
        }
        return;
      }

      const msg: string = errorMessageFromStatus(res, body, 'verifying your one‑time code');
      toast.error(msg);
      console.warn(`${LOG_PREFIX}: verify-otp failed`, { status: res.status, msg, body });
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        console.info(`${LOG_PREFIX}: verify-otp aborted`);
        return;
      }
      console.error(`${LOG_PREFIX}: network/unexpected error on verify-otp`, err);
      toast.error(`Unable to contact the server.${offlineHint()}`);
    } finally {
      if (isMountedRef.current) setLoading(false);
      controllerRef.current = null;
    }
  };

  const inputClass: string =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden';

  const buttonClass: string =
    'block center bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <TimelineEditModal isOpen={modalOpen} onClose={(): void => { abortInFlight(); reset(); }} title="Reset Password">
      {step === 'request' ? (
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Your email"
            className={inputClass}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button
            className={buttonClass}
            onClick={handleRequestOtp}
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            placeholder="Enter 6-digit code"
            className={inputClass}
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setOtp(e.target.value)}
            autoComplete="one-time-code"
          />
          <input
            type="password"
            placeholder="New password"
            className={inputClass}
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm password"
            className={inputClass}
            value={confirm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <button
            className={buttonClass}
            onClick={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      )}
    </TimelineEditModal>
  );
}
