import React from 'react';
import TimelineEditModal from '../components/TimelineEditModal';
import type { EditOrderForm } from '../components/EditOrderModal';

interface EditOrderModalViewProps {
  modalOpen: boolean;
  closeModal: () => void;
  form: EditOrderForm;
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => void;
}

export default function EditOrderModalView({
                                             modalOpen,
                                             closeModal,
                                             form,
                                             loading,
                                             handleChange,
                                             handleSave,
                                           }: Readonly<EditOrderModalViewProps>): React.ReactElement {
  return (
    <TimelineEditModal isOpen={modalOpen} onClose={closeModal} title="Edit Order">
      <div className="flex flex-col gap-4">
        {/* Project Type */}
        <div className="p-4 rounded-xl bg-[var(--theme-bg)] shadow-[0_0_10px_2px_var(--theme-shadow)] transition cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)]">
          <p className="text-lg text-[var(--theme-text)] underline mb-1">Project Type</p>
          <input
            name="projectType"
            placeholder="e.g. Web App"
            className="w-full bg-transparent text-[var(--theme-text)] focus:outline-none"
            value={form.projectType}
            onChange={handleChange}
          />
        </div>

        {/* Budget */}
        <div className="p-4 rounded-xl bg-[var(--theme-bg)] shadow-[0_0_10px_2px_var(--theme-shadow)] transition cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)]">
          <p className="text-lg text-[var(--theme-text)] underline mb-1">Budget</p>
          <input
            name="budget"
            placeholder="e.g. $3000"
            className="w-full bg-transparent text-[var(--theme-text)] focus:outline-none"
            value={form.budget}
            onChange={handleChange}
          />
        </div>

        {/* Timeline */}
        <div className="p-4 rounded-xl bg-[var(--theme-bg)] shadow-[0_0_10px_2px_var(--theme-shadow)] transition cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)]">
          <p className="text-lg text-[var(--theme-text)] underline mb-1">Timeline</p>
          <input
            name="timeline"
            placeholder="e.g. 4 weeks"
            className="w-full bg-transparent text-[var(--theme-text)] focus:outline-none"
            value={form.timeline}
            onChange={handleChange}
          />
        </div>

        {/* Business Name */}
        <div className="p-4 rounded-xl bg-[var(--theme-bg)] shadow-[0_0_10px_2px_var(--theme-shadow)] transition cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)]">
          <p className="text-lg text-[var(--theme-text)] underline mb-1">Business Name</p>
          <input
            name="businessName"
            placeholder="e.g. Acme Corp"
            className="w-full bg-transparent text-[var(--theme-text)] focus:outline-none"
            value={form.businessName}
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-[var(--theme-bg)] shadow-[0_0_10px_2px_var(--theme-shadow)] transition cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)]">
          <p className="text-lg text-[var(--theme-text)] underline mb-1">Project Description</p>
          <textarea
            name="description"
            placeholder="Tell me about your project..."
            className="w-full bg-transparent text-[var(--theme-text)] h-24 resize-y focus:outline-none"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {/* Button Row */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </TimelineEditModal>
  );
}
