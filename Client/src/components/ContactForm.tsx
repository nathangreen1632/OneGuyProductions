import React, {
  type ReactElement,
  type RefObject,
  useRef,
  useState,
  useEffect,
} from 'react';
import toast from 'react-hot-toast';
import type { ContactPayload, ContactResponse } from '../types/contact';
import type { ContactFormData } from '../types/formData';
import { useContactStore } from '../store/useContactStore';
import { waitForRecaptcha } from '../helpers/recaptcha';

const RECAPTCHA_SITE_KEY: string = '6LfNMZMrAAAAAPyNsUaFA22FmXQ9Tw-fd3s_Uy6q';

export default function ContactForm(): ReactElement {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });

  const lockRef: RefObject<boolean> = useRef<boolean>(false);
  const { submitting, setSubmitting } = useContactStore();

  useEffect(() => {
    console.log('⛳ VITE_RECAPTCHA_SITE_KEY at runtime:', import.meta.env.VITE_RECAPTCHA_SITE_KEY);

    if (typeof window === 'undefined') return;

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error('❌ No site key found at runtime!');
      return;
    }

    window.grecaptcha?.ready?.(() => {
      console.log('✅ reCAPTCHA ready');
    });
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
      if (!window.grecaptcha) {
        toast.error('reCAPTCHA is not available.');
        return;
      }

      await waitForRecaptcha();

      if (!window.grecaptcha?.execute) {
        toast.error('reCAPTCHA failed to load. Please refresh and try again.');
        return;
      }

      const captchaToken: string = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: 'submit_contact_form',
      });


      if (!captchaToken) {
        toast.error('CAPTCHA token not received.');
        return;
      }

      const payload: ContactPayload = { ...formData, captchaToken };

      const res: Response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: ContactResponse = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result?.error ?? 'Submission error');
      } else {
        toast.success('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (err: unknown) {
      console.error('Error submitting form:', err);
      toast.error('Something went wrong.');
    } finally {
      lockRef.current = false;
      setTimeout((): void => setSubmitting(false), 500);
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] bg-[var(--theme-base)] p-6">
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
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] placeholder:text-white placeholder:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] placeholder:text-white placeholder:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full h-32 px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] placeholder:text-white placeholder:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-black hover:text-white font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
