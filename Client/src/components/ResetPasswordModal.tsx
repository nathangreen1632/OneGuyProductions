// Client/src/components/ResetPasswordModal.tsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { useResetPasswordStore } from '../store/useResetPasswordStore';

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
        reset();
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

  return (
    <Modal isOpen={modalOpen} onClose={reset} title="Reset Password">
      {step === 'request' ? (
        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Your email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="btn"
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
            className="input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            className="btn"
            onClick={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      )}
    </Modal>
  );
}
