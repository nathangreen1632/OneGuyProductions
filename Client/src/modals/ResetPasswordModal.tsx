import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import TimelineEditModal from './TimelineEditModal';
import { useResetPasswordStore } from '../store/useResetPasswordStore';

type TResetStep = 'request' | 'verify';

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

  useEffect((): void => {
    if (!modalOpen) {
      setOtp('');
      setNewPassword('');
      setConfirm('');
      setEmail('');
      setStep('request');
    }
  }, [modalOpen, setEmail, setStep]);

  const handleRequestOtp = async (): Promise<void> => {
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      const res: Response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data: unknown = await res.json();
      if (res.ok) {
        toast.success('OTP sent to your email');
        setStep('verify');
      } else {
        toast.error((data as { error?: string })?.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (!otp || otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    if (newPassword !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res: Response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data: unknown = await res.json();
      if (res.ok) {
        toast.success('Password reset successfully');
        reset();
      } else {
        toast.error((data as { error?: string })?.error || 'Invalid OTP or expired');
      }
    } catch {
      toast.error('Server error.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass: string =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden';

  const buttonClass: string =
    'block center bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <TimelineEditModal isOpen={modalOpen} onClose={reset} title="Reset Password">
      {step === 'request' ? (
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Your email"
            className={inputClass}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value)}
          />
          <button
            className={buttonClass}
            onClick={handleRequestOtp}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            className={inputClass}
            value={otp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            className={inputClass}
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className={inputClass}
            value={confirm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setConfirm(e.target.value)}
          />
          <button
            className={buttonClass}
            onClick={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      )}
    </TimelineEditModal>
  );
}
