import React, { type ReactElement, type RefObject, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { ContactPayload, ContactResponse } from '../types/contact';
import type { ContactFormData } from '../types/formData';
import { useContactStore } from '../store/useContactStore';
import { loadRecaptcha } from '../utils/loadRecaptcha';
import { executeRecaptchaFlow } from '../utils/recaptchaHandler';

const RECAPTCHA_SITE_KEY: string = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const initialForm: ContactFormData = {
  name: '',
  email: '',
  message: '',
};

export default function ContactForm(): ReactElement {
  const [formData, setFormData] = useState<ContactFormData>(initialForm);
  const lockRef: RefObject<boolean> = useRef<boolean>(false);
  const { submitting, setSubmitting } = useContactStore();

  useEffect(() => {
    if (typeof window === 'undefined' || !RECAPTCHA_SITE_KEY) return;

    console.log('⛳ VITE_RECAPTCHA_SITE_KEY at runtime:', RECAPTCHA_SITE_KEY);

    // Inject reCAPTCHA script if not ready
    loadRecaptcha(RECAPTCHA_SITE_KEY);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    if (!name) return;

    if (name in formData) {
      setFormData((prev: ContactFormData): ContactFormData => ({
        ...prev,
        [name as keyof ContactFormData]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    try {
      const captchaToken = await executeRecaptchaFlow('submit_contact_form');
      if (!captchaToken) return;


      const payload: ContactPayload = { ...formData, captchaToken };
      console.log('📦 Step 3: Sending payload to backend...', payload);

      let res: Response;
      try {
        res = await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('❌ Failed at Step 3 (fetch error):', err);
        toast.error('Network error while submitting request.');
        return;
      }

      console.log('📬 Step 4: Awaiting server response...');
      const result: ContactResponse = await res.json();

      if (!res.ok || !result.success) {
        console.error('⚠️ Server responded with error:', result);
        toast.error(result?.error ?? 'Something went wrong. Please try again.');
      } else {
        console.log('✅ Step 4 complete: Success response received');
        toast.success('Message sent successfully!');
        setFormData(initialForm);
      }
    } catch (err: unknown) {
      console.error('🧨 Unexpected failure during form submission:', err);
      toast.error('Unexpected error. Try again or refresh the page.');
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  };

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
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full h-32 px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
