import React, { useState } from 'react';
import type { OrderFormData } from '../types/order.types';
import { useScrollLock } from '../hooks/useScrollLock.ts';

interface OrderFormViewProps {
  formData: OrderFormData;
  submitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function OrderFormView(
  { formData, submitting, handleChange, handleSubmit }: Readonly<OrderFormViewProps>
): React.ReactElement {
  const [descFocused, setDescFocused] = useState<boolean>(false);
  useScrollLock(descFocused);

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
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
            required
            value={formData.description}
            onChange={handleChange}
            onFocus={(): void => setDescFocused(true)}
            onBlur={(): void => setDescFocused(false)}
            placeholder={`Tell me about your project... Please be as detailed as possible.

- What problem does it solve?
- Who is the target audience?
- What features are essential?
- Any specific design or tech stack preferences?`}
            className="w-full h-60 max-h-[60vh] px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)]
                       placeholder:text-[var(--theme-text)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                       shadow-[0_4px_14px_0_var(--theme-shadow)] resize-none overflow-y-auto overscroll-contain custom-scrollbar"
          />

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] cursor-pointer font-semibold py-2 px-6 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
