import React from 'react';

type Props = {
  email: string;
  otp: string;
  loading: boolean;
  inputClass: string;
  setEmail: (v: string) => void;
  setOtp: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
};

export default function AdminVerifyView(props: Readonly<Props>): React.ReactElement {
  const { email, otp, loading, inputClass, setEmail, setOtp, onSubmit, onResend } = props;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@oneguyproductions.com"
        className={inputClass}
        type="email"
        autoComplete="email"
      />
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="6-digit code"
        className={inputClass}
        inputMode="numeric"
        autoComplete="one-time-code"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-70"
        >
          {loading ? 'Please wait…' : 'Verify Admin Email'}
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={loading}
          className="btn-secondary disabled:opacity-70"
        >
          Resend Code
        </button>
      </div>
    </form>
  );
}
