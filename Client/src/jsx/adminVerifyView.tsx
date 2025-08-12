import React from 'react';
import toast from 'react-hot-toast';

type Props = {
  email: string;
  otp: string;
  loading: boolean;
  inputClass: string;
  setEmail: (v: string) => void;
  setOtp: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void | boolean | { ok: boolean; message?: string }>;
  onResend: () => void | Promise<void | boolean | { ok: boolean; message?: string }>;
};

function toOutcome(
  result: unknown
): { ok: boolean; message?: string } {
  if (typeof result === 'boolean') return { ok: result };
  if (result && typeof result === 'object' && 'ok' in (result as any)) {
    const r = result as { ok: boolean; message?: string };
    return { ok: r.ok, message: r.message };
  }
  // If handler returns nothing, assume success (common for fire-and-forget handlers)
  return { ok: true };
}

export default function AdminVerifyView(props: Readonly<Props>): React.ReactElement {
  const { email, otp, loading, inputClass, setEmail, setOtp, onSubmit, onResend } = props;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const result = await onSubmit(e);
      const { ok, message } = toOutcome(result);
      if (ok) {
        toast.success(message ?? 'Admin email verified ✅');
      } else {
        toast.error(message ?? 'Verification failed. Check your code and try again.');
      }
    } catch (err: any) {
      const msg = (err?.message as string) || 'Verification failed. Please try again.';
      toast.error(msg);
    }
  };

  const handleResend = async (): Promise<void> => {
    try {
      const result = await onResend();
      const { ok, message } = toOutcome(result);
      if (ok) {
        toast.success(message ?? 'A new verification code was sent.');
      } else {
        toast.error(message ?? 'Could not resend code. Please wait and try again.');
      }
    } catch (err: any) {
      const msg = (err?.message as string) || 'Could not resend code. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <article className="w-full max-w-md rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] p-6 shadow-[0_4px_14px_0_var(--theme-shadow)] border border-[var(--theme-border)]">
        <h2 className="text-xl font-bold mb-8 text-center">Admin Email Verification</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminEmail" className="block text-lg mb-2">
              Admin Email Address
            </label>
            <input
              id="adminEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@oneguyproductions.com"
              className={`${inputClass} w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2`}
              type="email"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="adminOtp" className="block text-lg pt-4 mb-2">
              One-Time Passcode (6 digits)
            </label>
            <input
              id="adminOtp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              className={`${inputClass} w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2`}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
          <div className="flex flex-wrap gap-3 justify-center pt-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[var(--theme-button)] text-[var(--theme-text-white)] text-sm rounded shadow-md hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 disabled:opacity-70"
            >
              {loading ? 'Please wait…' : 'Verify Admin Email'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="px-4 py-2 bg-[var(--theme-border-red)] hover:bg-[var(--theme-button-red)] text-[var(--theme-text-white)] text-sm rounded shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 disabled:opacity-70"
            >
              Resend Code
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
