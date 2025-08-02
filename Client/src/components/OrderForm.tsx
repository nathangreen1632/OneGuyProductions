import React, {
  type ReactElement,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import type {
  DerivedOrderFormData,
  OrderFormData,
  OrderPayload,
  OrderResponse,
} from '../types/order';
import { useOrderStore } from '../store/useOrderStore';
import {
  waitForRecaptchaReady,
  loadRecaptcha,
} from '../utils/loadRecaptcha';
import { getRecaptchaToken } from '../utils/getRecaptchaToken'; // ✅ New import

const RECAPTCHA_SITE_KEY: string = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const initialForm: Omit<DerivedOrderFormData, 'captchaToken'> = {
  name: '',
  email: '',
  businessName: '',
  projectType: '',
  budget: '',
  timeline: '',
  description: '',
};

export default function OrderForm(): ReactElement {
  const [formData, setFormData] = useState<OrderFormData>(initialForm);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const lockRef: RefObject<boolean> = useRef<boolean>(false);
  const { setLastOrder, clearOrder } = useOrderStore();

  useEffect((): void => {
    if (typeof window === 'undefined' || !RECAPTCHA_SITE_KEY) return;

    console.log('⛳ VITE_RECAPTCHA_SITE_KEY at runtime:', RECAPTCHA_SITE_KEY);

    // ✅ Ensure grecaptcha is injected or initialized again after SPA route nav
    loadRecaptcha(RECAPTCHA_SITE_KEY);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = e.target;
    if (!name) return;

    if (name in formData) {
      setFormData((prev: OrderFormData): OrderFormData => ({
        ...prev,
        [name as keyof OrderFormData]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    try {
      console.log('🌀 Step 1: Waiting for grecaptcha...');
      try {
        await waitForRecaptchaReady();
        console.log('✅ Step 1 complete: grecaptcha is ready');
      } catch (err) {
        console.error('❌ Failed at Step 1 (waitForRecaptcha):', err);
        toast.error('CAPTCHA failed to initialize.');
        return;
      }

      console.log('🌀 Step 2: Getting token...');
      let captchaToken: string;
      try {
        captchaToken = await getRecaptchaToken('submit_order_form', RECAPTCHA_SITE_KEY);
        console.log('✅ Step 2 complete: Token retrieved');
      } catch (err) {
        console.error('❌ Failed at Step 2 (getRecaptchaToken):', err);
        toast.error('CAPTCHA token failed. Please refresh and try again.');
        return;
      }

      const payload: OrderPayload = { ...formData, captchaToken };
      console.log('📦 Step 3: Sending payload to backend...', payload);

      let res: Response;
      try {
        res = await fetch('/api/order/submit', {
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
      if (res.ok) {
        console.log('✅ Step 4 complete: Success response received');
        toast.success('Your request was submitted successfully!');
        setLastOrder(payload);
        clearOrder();
        setFormData(initialForm);
      } else {
        let result: OrderResponse | null = null;
        try {
          result = await res.json();
          console.error('⚠️ Server responded with error:', result);
        } catch (jsonErr) {
          console.error('❌ Failed to parse error response:', jsonErr);
        }

        toast.error(result?.error ?? 'Something went wrong. Please try again.');
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
      <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] p-6">
        <h2 className="text-2xl font-bold text-[var(--theme-accent)] mb-6 text-center">
          Project Request Form
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="name"
            placeholder="Name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <input
            name="businessName"
            placeholder="Business Name (If applicable)"
            value={formData.businessName}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <div className="relative rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden">
            <select
              name="projectType"
              required
              value={formData.projectType}
              onChange={handleChange}
              className="w-full px-4 py-2 pr-10 bg-[var(--theme-surface)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 rounded-2xl appearance-none"
            >
              <option value="">Select Project Type</option>
              <option>Portfolio</option>
              <option>E-commerce</option>
              <option>Landing Page</option>
              <option>Custom Web App</option>
              <option>SaaS Product</option>
              <option>AI-Powered Tool</option>
              <option>Job Board</option>
              <option>Resume Builder</option>
              <option>Legal Tech App</option>
              <option>Data Analytics Dashboard</option>
              <option>API Integration Project</option>
              <option>Authentication System</option>
              <option>Real-Time Chatbot</option>
              <option>Multi-Page Form App</option>
              <option>Geolocation App</option>
              <option>OTP/Password Reset System</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--theme-text)]">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </div>
          </div>
          <div className="relative rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden">
            <select
              name="budget"
              required
              value={formData.budget}
              onChange={handleChange}
              className="w-full px-4 py-2 pr-10 bg-[var(--theme-surface)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 rounded-2xl appearance-none"
            >
              <option value="">Select Budget</option>
              <option value="$250-$500">$250 – $500</option>
              <option value="$501-$1000">$501 – $1,000</option>
              <option value="$1001-$2500">$1,001 – $2,500</option>
              <option value="$2501-$5000">$2,501 – $5,000</option>
              <option value="$5000+">$5,000+</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--theme-text)]">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </div>
          </div>
          <input
            name="timeline"
            placeholder="Timeframe... (e.g. 4 weeks)"
            required
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <textarea
            name="description"
            placeholder={`Tell me about your project... Please be as detailed as possible.

- What problem does it solve?
- Who is the target audience?
- What features are essential?
- Any specific design or tech stack preferences?`}
            required
            value={formData.description}
            onChange={handleChange}
            className="w-full h-56 px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
