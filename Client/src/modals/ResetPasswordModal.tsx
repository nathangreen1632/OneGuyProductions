import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import TimelineEditModal from './TimelineEditModal.tsx';
import { useResetPasswordStore } from '../store/useResetPasswordStore.ts';

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
  } = useResetPasswordStore();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // 🧼 Clear local state when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setOtp('');
      setNewPassword('');
      setConfirm('');
      setEmail('');
      setStep('request');
    }
  }, [modalOpen, setEmail, setStep]);

  const handleRequestOtp = async () => {
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('OTP sent to your email');
        setStep('verify');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
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
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Password reset successfully');
        reset(); // 🔒 closes modal + clears store
      } else {
        toast.error(data.error || 'Invalid OTP or expired');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden';

  const buttonClass =
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
