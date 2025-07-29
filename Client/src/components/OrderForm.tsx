import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import type { OrderPayload } from '../types/order';
import { useOrderStore } from '../store/useOrderStore';

const initialForm: Omit<OrderPayload, 'captchaToken'> = {
  name: '',
  email: '',
  businessName: '',
  projectType: '',
  budget: '',
  timeline: '',
  description: '',
};

export default function OrderForm() {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { setLastOrder, clearOrder } = useOrderStore();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const lockRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (!window.grecaptcha || !siteKey) {
        toast.error('reCAPTCHA not available.');
        return;
      }

      await new Promise<void>((resolve) => window.grecaptcha.ready(resolve));
      const captchaToken = await window.grecaptcha.execute(siteKey, { action: 'order_form' });

      if (!captchaToken) {
        toast.error('CAPTCHA token failed.');
        return;
      }

      const payload: OrderPayload = { ...formData, captchaToken };

      const res = await fetch('/api/order/submit', {
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
        toast.error('Something went wrong. Please try again.');
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
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-border-red)] rounded-lg shadow-[0_4px_14px_0_var(--theme-shadow)] p-6">
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
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <input
            name="businessName"
            placeholder="Business Name"
            value={formData.businessName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <select
            name="projectType"
            required
            value={formData.projectType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          >
            <option value="">Select Project Type</option>
            <option>Portfolio</option>
            <option>E-commerce</option>
            <option>Landing Page</option>
            <option>Custom Web App</option>
          </select>
          <select
            name="budget"
            required
            value={formData.budget}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          >
            <option value="">Select Budget</option>
            <option>$500 - $1,000</option>
            <option>$1,000 - $2,500</option>
            <option>$2,500 - $5,000+</option>
          </select>
          <input
            name="timeline"
            placeholder="Desired Timeline (e.g. 4 weeks)"
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <textarea
            name="description"
            placeholder="Tell me about your project..."
            required
            value={formData.description}
            onChange={handleChange}
            className="w-full h-32 px-4 py-2 border border-[var(--theme-border-red)] rounded bg-[var(--theme-base)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-black hover:text-white font-semibold py-2 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]"
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>
    </section>
  );
}
