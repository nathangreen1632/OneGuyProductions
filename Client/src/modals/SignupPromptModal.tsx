import React from 'react';
import { useNavigate } from 'react-router-dom';
import TimelineEditModal from './TimelineEditModal';
import { useSignupPromptStore } from '../store/useSignupPromptStore';

export default function SignupPromptModal(): React.ReactElement | null {
  const { open, email, orderId, closePrompt, markPrompted } = useSignupPromptStore();
  const navigate = useNavigate();

  if (!open) return null;

  const goSignup = () => {
    if (email) markPrompted(email);
    // Navigate to /auth (or wherever your AuthFormLogic renders) in register mode
    // We'll stash orderId in sessionStorage to link post-signup.
    if (orderId != null) {
      sessionStorage.setItem('linkOrderId', String(orderId));
    }
    if (email) {
      sessionStorage.setItem('prefillEmail', email);
    }
    closePrompt();
    navigate('/auth?mode=register'); // adjust if your route differs
  };

  const skip = () => {
    if (email) markPrompted(email);
    closePrompt();
  };

  const button =
    'block center bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30';

  return (
    <TimelineEditModal isOpen={open} onClose={skip} title="Save your order?">
      <p className="text-sm">
        Create a free account so you can view this order in your customer portal.
      </p>
      <div className="flex gap-3 justify-center mt-2">
        <button className={button} onClick={goSignup}>Yes, create my account</button>
        <button className={`${button} bg-gray-500 hover:bg-gray-600`} onClick={skip}>No thanks</button>
      </div>
    </TimelineEditModal>
  );
}
