import React from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminVerifyView from '../../jsx/admin/adminVerifyView';
import {
  readPrefillEmail,
  isLikelyEmail,
  postJson,
  pickErrorMessage,
  type JsonResult,
} from '../../helpers/admin/adminVerify.helper';

export default function AdminVerifyLogic(): React.ReactElement {
  const navigate: NavigateFunction = useNavigate();

  const [email, setEmail] = React.useState<string>(readPrefillEmail());
  const [otp, setOtp] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  async function handleVerify(e: React.FormEvent): Promise<void> {
    try {
      e.preventDefault();

      const trimmedEmail: string = (email ?? '').trim();
      const trimmedOtp: string = (otp ?? '').trim();

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

      const result: JsonResult<any> = await postJson('/api/auth/verify-email', {
        email: trimmedEmail,
        otp: trimmedOtp,
      });

      if (!result.ok) {
        const msg: string = pickErrorMessage(result, `Verification failed (HTTP ${result.status}).`);
        console.warn('AdminVerify: verification failed.', { status: result.status, msg });
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

      const result: JsonResult<any> = await postJson('/api/auth/request-admin-otp', {
        email: trimmedEmail,
      });

      if (!result.ok) {
        const msg: string = pickErrorMessage(result, `Could not send a new code (HTTP ${result.status}).`);
        console.warn('AdminVerify: resend failed.', { status: result.status, msg });
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
