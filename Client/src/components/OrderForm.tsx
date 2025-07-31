import React, {useState, useRef, type RefObject} from 'react';
import toast from 'react-hot-toast';
import type {OrderPayload, OrderFormData, OrderResponse, DerivedOrderFormData} from '../types/order';
import { useOrderStore } from '../store/useOrderStore';
import { waitForRecaptcha } from '../helpers/recaptcha';

const initialForm: Omit<DerivedOrderFormData, 'captchaToken'> = {
  name: '',
  email: '',
  businessName: '',
  projectType: '',
  budget: '',
  timeline: '',
  description: '',
};

if (typeof window !== 'undefined' && !document.getElementById('recaptcha-script')) {
  const script: HTMLScriptElement = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/enterprise.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function OrderForm(): React.ReactElement {
  const [formData, setFormData] = useState<OrderFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { setLastOrder, clearOrder } = useOrderStore();

  const lockRef: RefObject<boolean> = useRef(false);


  const handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;

    if (!name) return;

    if (name in formData) {
      setFormData((prev: OrderFormData): { name: string; email: string; businessName: string; projectType: string; budget: string; timeline: string; description: string } => ({
        ...prev,
        [name as keyof OrderFormData]: value,
      }));
    }
  };


  const handleSubmit: (e: React.FormEvent) => Promise<void> = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    try {
      const siteKey: string | undefined = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (!window.grecaptcha || !siteKey) {
        toast.error('reCAPTCHA not available.');
        return;
      }

      await waitForRecaptcha();

      const captchaToken: string = await window.grecaptcha.execute(siteKey, {
        action: 'submit_order_form',
      });

      if (!captchaToken) {
        toast.error('CAPTCHA token failed.');
        return;
      }

      const payload: OrderPayload = { ...formData, captchaToken };

      const res: Response = await fetch('/api/order/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Your request was submitted successfully!');
        setLastOrder(payload);
        clearOrder();
        setFormData(initialForm);
      } else {
        const result: OrderResponse = await res.json();
        toast.error(result?.error ?? 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting order form:', error);
      toast.error('CAPTCHA failed or network error.');
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-[var(--theme-base)] text-[var(--theme-text)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] p-6">
        <h2 className="text-2xl font-bold text-[var(--theme-accent)] mb-6 text-center">
          Start Your Project
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            name="name"
            placeholder="Name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] placeholder:text-white placeholder:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] placeholder:text-white placeholder:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <input
            name="businessName"
            placeholder="Business Name (If applicable)"
            value={formData.businessName}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] placeholder:text-white placeholder:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <select
            name="projectType"
            required
            value={formData.projectType}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)]  focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
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
          <select
            name="budget"
            required
            value={formData.budget}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          >
            <option value="">Select Budget</option>
            <option value="$250-$500">$250 – $500</option>
            <option value="$501-$1000">$501 – $1,000</option>
            <option value="$1001-$2500">$1,001 – $2,500</option>
            <option value="$2501-$5000">$2,501 – $5,000</option>
            <option value="$5000+">$5,000+</option>
          </select>
          <input
            name="timeline"
            placeholder="Desired Timeline (e.g. 4 weeks)"
            required
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] placeholder:text-white placeholder:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
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
            className="w-full h-52 px-4 py-2 rounded-2xl bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-black hover:text-white font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
