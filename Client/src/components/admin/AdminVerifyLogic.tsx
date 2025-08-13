import React from 'react';
import {type NavigateFunction, useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminVerifyView from '../../jsx/admin/adminVerifyView.tsx';

export default function AdminVerifyLogic(): React.ReactElement {
  const navigate: NavigateFunction = useNavigate();

  const [email, setEmail] = React.useState<string>(sessionStorage.getItem('prefillEmail') || '');
  const [otp, setOtp] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  async function handleVerify(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email || !otp) {
      toast.error('Enter email and code');
      return;
    }
    setLoading(true);
    try {
      const res: Response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data)?.error || 'Invalid or expired code.');
        return;
      }
      toast.success('Admin email verified! Please log in.');
      // If you later choose to auto-login at the server, you could redirect to /admin/orders here instead.
      navigate('/auth', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    if (!email) {
      toast.error('Enter your @oneguyproductions.com email');
      return;
    }
    setLoading(true);
    try {
      const res: Response = await fetch('/api/auth/request-admin-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch((): {} => ({}));
      if (!res.ok) {
        toast.error((data)?.error || 'Could not send a new code.');
        return;
      }
      toast.success('New admin verification code sent.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]';

  return (
    <AdminVerifyView
      email={email}
      otp={otp}
      loading={loading}
      inputClass={inputClass}
      setEmail={setEmail}
      setOtp={setOtp}
      onSubmit={handleVerify}
      onResend={handleResend}
    />
  );
}
