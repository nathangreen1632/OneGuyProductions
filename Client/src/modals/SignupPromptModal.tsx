import React from 'react';
import toast from 'react-hot-toast';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import TimelineEditModal from './TimelineEditModal';
import { useSignupPromptStore } from '../store/useSignupPrompt.store';

const LOG_PREFIX = 'SignupPromptModal';

function setSessionItemSafe(key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(key, value);
  } catch (err) {
    console.warn(`${LOG_PREFIX}: failed to set sessionStorage item "${key}"`, err);
  }
}

export default function SignupPromptModal(): React.ReactElement | null {
  const { open, email, orderId, closePrompt, markPrompted } = useSignupPromptStore();
  const navigate: NavigateFunction = useNavigate();

  if (!open) return null;

  const goSignup: () => void = (): void => {
    try {
      if (email) {
        try {
          markPrompted(email);
        } catch (err) {
          console.error(`${LOG_PREFIX}: markPrompted threw`, err);
        }
        setSessionItemSafe('prefillEmail', email);
      }
      if (orderId != null) setSessionItemSafe('linkOrderId', String(orderId));

      try {
        closePrompt();
      } catch (err) {
        console.error(`${LOG_PREFIX}: closePrompt threw`, err);
      }

      try {
        navigate('/auth?mode=register');
      } catch (err) {
        console.error(`${LOG_PREFIX}: navigation to /auth failed`, err);
        toast('We saved your info, but could not open the sign‑up page. Please try again from the menu.', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error(`${LOG_PREFIX}: unexpected error in goSignup`, err);
      toast.error('Something went wrong preparing your sign‑up. Please try again.');
    }
  };

  const skip: () => void = (): void => {
    try {
      if (email) {
        try {
          markPrompted(email);
        } catch (err) {
          console.error(`${LOG_PREFIX}: markPrompted threw (skip)`, err);
        }
      }
      try {
        closePrompt();
      } catch (err) {
        console.error(`${LOG_PREFIX}: closePrompt threw (skip)`, err);
        toast.error('Could not close this prompt. You can refresh the page to dismiss it.');
      }
    } catch (err) {
      console.error(`${LOG_PREFIX}: unexpected error in skip`, err);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const buttonClass: string =
    'block center bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] cursor-pointer font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30';

  return (
    <TimelineEditModal isOpen={open} onClose={skip} title="Save your order?">
      <p className="text-sm">
        Create a free account so you can view this order in your customer portal.
      </p>
      <div className="flex gap-3 justify-center mt-2">
        <button className={buttonClass} onClick={goSignup}>
          Yes, create my account
        </button>
        <button
          className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}
          onClick={skip}
        >
          No thanks
        </button>
      </div>
    </TimelineEditModal>
  );
}
