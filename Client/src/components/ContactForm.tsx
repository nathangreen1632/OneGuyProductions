import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { ContactPayload } from '../types/contact';
import { useContactStore } from '../store/useContactStore';
import { waitForRecaptcha } from '../helpers/recaptcha';

const RECAPTCHA_SITE_KEY = '6LfNMZMrAAAAAPyNsUaFA22FmXQ9Tw-fd3s_Uy6q';

// Inject reCAPTCHA script once
if (typeof window !== 'undefined' && !document.getElementById('recaptcha-script')) {
  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const lockRef = useRef(false);
  const { submitting, setSubmitting } = useContactStore();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    try {
      if (!window.grecaptcha) {
        toast.error('reCAPTCHA is not available.');
        return;
      }

      await waitForRecaptcha();

      const captchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: 'submit_contact_form',
      });

      if (!captchaToken) {
        toast.error('CAPTCHA token not received.');
        return;
      }

      const payload: ContactPayload = { ...formData, captchaToken };

      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result?.error ?? 'Submission error');
      } else {
        toast.success('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error('Something went wrong.');
    } finally {
      lockRef.current = false;
      setTimeout(() => setSubmitting(false), 500);
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border-red)] rounded-lg shadow-[0_4px_14px_0_var(--theme-shadow)] p-6">
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
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full h-32 px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-black hover:text-white font-semibold py-2 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
}
