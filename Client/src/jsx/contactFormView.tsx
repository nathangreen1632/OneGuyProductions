import React, { useState } from 'react';
import type { ContactFormData } from '../types/formData.types';
import { useScrollLock } from '../hooks/useScrollLock.ts';

interface ContactFormViewProps {
  formData: ContactFormData;
  submitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isRecaptchaReady: boolean;
}

export default function ContactFormView({
                                          formData,
                                          submitting,
                                          handleChange,
                                          handleSubmit,
                                          isRecaptchaReady,
                                        }: Readonly<ContactFormViewProps>): React.ReactElement {
  const [msgFocused, setMsgFocused] = useState<boolean>(false);
  useScrollLock(msgFocused);

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] bg-[var(--theme-surface)] p-6">
        <h2 className="text-2xl font-bold text-[var(--theme-accent)] mb-6 text-center">
          Contact Me
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)]"
          />

          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            onFocus={(): void => setMsgFocused(true)}
            onBlur={(): void => setMsgFocused(false)}
            required
            className="w-full h-60 max-h-[60vh] px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)]
                       placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                       shadow-[0_4px_14px_0_var(--theme-shadow)] resize-none overflow-y-auto overscroll-contain custom-scrollbar"
          />

          <div className="flex justify-center items-center gap-4">
            <button
              type="submit"
              disabled={submitting || !isRecaptchaReady}
              className="w-fit bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)]
                         cursor-pointer py-2 px-6 rounded transition-all duration-150
                         focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>

          <div className="flex justify-center items-center mt-4">
            {!isRecaptchaReady && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-red-500">reCAPTCHA loading…</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
