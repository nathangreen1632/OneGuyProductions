import React, { useState } from 'react';
import type { OrderFormData } from '../types/order.types';
import { useScrollLock } from '../hooks/useScrollLock.ts';
import { Info } from 'lucide-react';

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
  const [showHelp, setShowHelp] = useState<boolean>(false);
  useScrollLock(descFocused);

  return (
    <section className="max-w-2xl mx-auto px-4 py-4">
      <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-2xl
                    focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                    shadow-[0_4px_14px_0_var(--theme-shadow)] p-6">
        <h2 className="text-2xl font-bold text-[var(--theme-accent)] mb-6 text-center">
          Project Request Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-sm mb-2">Name</h2>
          <input
            name="name"
            placeholder="Name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)]
                     text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/20
                     focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                     shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />

          <h2 className="text-sm mb-2">Email</h2>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)]
                     text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/20
                     focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                     shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />

          <h2 className="text-sm mb-2">
            Business Name <span className="opacity-70">(optional)</span>
          </h2>
          <input
            name="businessName"
            placeholder="Business Name (If applicable)"
            value={formData.businessName}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)]
                     text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/20
                     focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                     shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />

          <h2 className="text-sm mb-2">Project Type</h2>
          <div className="relative rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden">
            <select
              name="projectType"
              required
              value={formData.projectType}
              onChange={handleChange}
              className={`w-full px-4 py-2 pr-10 bg-[var(--theme-surface)] 
                        ${formData.projectType === '' ? 'text-[var(--theme-text)]/20' : 'text-[var(--theme-text)]'} 
                        focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 
                        rounded-2xl appearance-none`}
            >
              <option value="">Select Project Type</option>
              <option>Portfolio</option>
              <option>Landing Page</option>
              <option>Marketing Site (SEO/OG)</option>
              <option>E-commerce</option>
              <option>Custom Web App</option>
              <option>SaaS Product</option>
              <option>AI-Powered Tool</option>
              <option>Resume Builder</option>
              <option>Job Board / Aggregator</option>
              <option>Interview Prep Tool</option>
              <option>Legal Tech App</option>
              <option>Document / Contract Analyzer</option>
              <option>Chatbot (Document-Aware or Real-Time)</option>
              <option>Data Analytics Dashboard</option>
              <option>Geolocation / Maps App</option>
              <option>Multi-Step Form / Wizard</option>
              <option>Authentication & Security (JWT + OTP)</option>
              <option>API Integration Project</option>
              <option>Admin Dashboard / Customer Portal</option>
              <option>PDF / DOCX Generator</option>
              <option>Social Sharing + Open Graph</option>
            </select>

            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--theme-text)]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </div>
          </div>

          <h2 className="text-sm mb-2">Budget</h2>
          <div className="relative rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden">
            <select
              name="budget"
              required
              value={formData.budget}
              onChange={handleChange}
              className={`w-full px-4 py-2 pr-10 bg-[var(--theme-surface)] 
                        ${formData.budget === '' ? 'text-[var(--theme-text)]/20' : 'text-[var(--theme-text)]'} 
                        focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 
                        rounded-2xl appearance-none`}
            >
              <option value="">Select Budget</option>
              <option value="$300-$750">$300 – $750 (Landing Page / Simple Site)</option>
              <option value="$751-$1500">$751 – $1,500 (Portfolio / Small Business Site)</option>
              <option value="$1501-$3000">$1,501 – $3,000 (E-commerce / Custom Features)</option>
              <option value="$3001-$6000">$3,001 – $6,000 (Dashboards / AI Tools / SaaS MVP)</option>
              <option value="$6001-$10000">$6,001 – $10,000 (Larger Web App / Multi-System Integration)</option>
              <option value="$10000+">$10,000+ (Enterprise / Complex Project)</option>
            </select>

            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--theme-text)]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </div>
          </div>

          <h2 className="text-sm mb-2">Timeline</h2>
          <input
            name="timeline"
            placeholder="Timeframe... (e.g. 4 weeks)"
            required
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)]
                     text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/20
                     focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                     shadow-[0_4px_14px_0_var(--theme-shadow)] overflow-hidden"
          />

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm mb-2">Description</h2>
            <div className="relative">
              <button
                type="button"
                aria-label="Description help"
                aria-describedby="description-help"
                onClick={(): void => setShowHelp((s) => !s)}
                onBlur={(): void => setShowHelp(false)}
                onMouseEnter={(): void => setShowHelp(true)}
                onMouseLeave={(): void => setShowHelp(false)}
                className="p-1 rounded-full focus:outline-none"
                title="What to include"
              >
                <Info className="w-5 h-5 text-[var(--theme-border-red)]" />
              </button>

              {showHelp && (
                <div
                  id="description-help"
                  role="tooltip"
                  className="absolute right-0 z-20 mt-2 w-80 text-sm
                           bg-[var(--theme-surface)] text-[var(--theme-text)]
                           rounded-xl shadow-[0_4px_14px_0_var(--theme-shadow)] p-3"
                >
                  <p className="font-semibold mb-1">Tell me about your project…</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>What problem does it solve?</li>
                    <li>Who is the target audience?</li>
                    <li>What features are essential?</li>
                    <li>Any specific design or tech stack preferences?</li>
                    <li>What are your goals and success metrics?</li>
                    <li>Any examples of similar projects you like?</li>
                    <li>Any other relevant details?</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <textarea
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            onFocus={(): void => setDescFocused(true)}
            onBlur={(): void => setDescFocused(false)}
            placeholder=""
            className="w-full h-60 max-h-[60vh] px-4 py-2 rounded-2xl bg-[var(--theme-surface)]
                     text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/60
                     focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
                     shadow-[0_4px_14px_0_var(--theme-shadow)] resize-none overflow-y-auto
                     overscroll-contain custom-scrollbar"
          />

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit bg-[var(--theme-button)] hover:bg-[var(--theme-hover)]
                       text-[var(--theme-text-white)] cursor-pointer py-2 px-6
                       rounded transition-all duration-150 focus:outline-none
                       focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );

}
