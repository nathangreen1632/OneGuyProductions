import React from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminVerifyView from '../../jsx/admin/adminVerifyView';

function readPrefillEmail(): string {
  try {
    const v = sessionStorage.getItem('prefillEmail');
    return typeof v === 'string' ? v : '';
  } catch (err) {
    console.warn('AdminVerify: failed to read prefillEmail from sessionStorage.', err);
    toast.error('Could not load saved email (session storage)');
    return '';
  }
}

function isLikelyEmail(s: string): boolean {
  if (!s.includes('@')) return false;
  const [local, domain] = s.split('@');
  return !(!local || !domain?.includes('.'));
}


export default function AdminVerifyLogic(): React.ReactElement {
  const navigate: NavigateFunction = useNavigate();

  const [email, setEmail] = React.useState<string>(readPrefillEmail());
  const [otp, setOtp] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  async function handleVerify(e: React.FormEvent): Promise<void> {
    try {
      e.preventDefault();

      const trimmedEmail = (email ?? '').trim();
      const trimmedOtp = (otp ?? '').trim();

      if (!trimmedEmail || !trimmedOtp) {
        console.warn('AdminVerify: missing email or OTP.');
        toast.error('Please enter your email and verification code.');
        return;
      }

      if (!isLikelyEmail(trimmedEmail)) {
        console.warn('AdminVerify: invalid email format.', trimmedEmail);
        toast.error('Invalid email format.');
        return;
      }

      if (trimmedOtp.length < 4) {
        console.warn('AdminVerify: OTP too short.');
        toast.error('Verification code looks too short.');
        return;
      }

      if (loading) {
        console.warn('AdminVerify: verify blocked while loading.');
        toast.error('Please wait… verifying your code.');
        return;
      }

      setLoading(true);

      let res: Response | null = null;
      try {
        res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: trimmedEmail, otp: trimmedOtp }),
        });
      } catch (err) {
        console.error('AdminVerify: network error during verify.', err);
        toast.error('Network error while verifying. Please try again.');
        return;
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg: string =
          (data && typeof data.error === 'string' && data.error) ||
          `Verification failed (HTTP ${res.status}).`;
        console.warn('AdminVerify: verification failed.', { status: res.status, msg });
        toast.error(msg);
        return;
      }

      toast.success('Admin email verified! Please log in.');
      try {
        navigate('/auth', { replace: true });
      } catch (err) {
        console.error('AdminVerify: navigation failed after verify.', err);
        toast.error('Verified, but navigation failed. Please go to the login page.');
      }
    } catch (err) {
      console.error('AdminVerify: unexpected error in handleVerify.', err);
      toast.error('Unexpected error while verifying. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    try {
      const trimmedEmail: string = (email ?? '').trim();

      if (!trimmedEmail) {
        console.warn('AdminVerify: resend attempted without email.');
        toast.error('Enter your @oneguyproductions.com email.');
        return;
      }

      if (!isLikelyEmail(trimmedEmail)) {
        console.warn('AdminVerify: invalid email format on resend.', trimmedEmail);
        toast.error('Invalid email format.');
        return;
      }

      if (loading) {
        console.warn('AdminVerify: resend blocked while loading.');
        toast.error('Please wait… sending a new code.');
        return;
      }

      setLoading(true);

      let res: Response | null = null;
      try {
        res = await fetch('/api/auth/request-admin-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: trimmedEmail }),
        });
      } catch (err) {
        console.error('AdminVerify: network error during resend.', err);
        toast.error('Network error while requesting a new code.');
        return;
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg: string =
          (data && typeof data.error === 'string' && data.error) ||
          `Could not send a new code (HTTP ${res.status}).`;
        console.warn('AdminVerify: resend failed.', { status: res.status, msg });
        toast.error(msg);
        return;
      }

      toast.success('New admin verification code sent.');
    } catch (err) {
      console.error('AdminVerify: unexpected error in handleResend.', err);
      toast.error('Unexpected error while requesting a new code.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]';

  return (
    <AdminVerifyView
      email={email ?? ''}
      otp={otp ?? ''}
      loading={Boolean(loading)}
      inputClass={inputClass}
      setEmail={setEmail}
      setOtp={setOtp}
      onSubmit={handleVerify}
      onResend={handleResend}
    />
  );
}
