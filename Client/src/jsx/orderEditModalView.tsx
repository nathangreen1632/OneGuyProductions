import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Order } from '../types/order.types';
import { isWithin72Hours } from '../helpers/dateHelper';
import type { FormState } from '../types/formState.types';
import { useScrollLock } from '../hooks/useScrollLock.ts';

interface Props {
  order: Order;
  onClose: () => void;
  onSave: (updatedOrder: Partial<Order>) => void;
}

export default function OrderEditModalView(
  { order, onClose, onSave }: Readonly<Props>
): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    businessName: order.businessName,
    projectType: order.projectType,
    budget: order.budget,
    timeline: order.timeline,
    description: order.description,
  });

  // Lock background scroll while modal is open
  useScrollLock(true);

  const isEditable: boolean = isWithin72Hours(order.createdAt);

  useEffect((): void => {
    setForm({
      businessName: order.businessName,
      projectType: order.projectType,
      budget: order.budget,
      timeline: order.timeline,
      description: order.description,
    });
  }, [order]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev: FormState): FormState => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (): void => {
    onSave({ ...order, ...form });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0"
      aria-labelledby="edit-order-title"
      role="text"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-hidden="false"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-2xl shadow-[0_6px_24px_0_var(--theme-shadow)] overflow-hidden max-h-[90svh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--theme-border-red)]/30 flex items-center justify-between">
          <h2 id="edit-order-title" className="text-lg font-semibold">
            Edit Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full"
          >
            <X className="h-5 w-5 text-[var(--theme-border-red)] hover:text-[var(--theme-button-red)]/80 cursor-pointer" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="businessName" className="text-sm block mb-1">
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] shadow-[0_6px_24px_0_var(--theme-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            />
          </div>

          <div>
            <label htmlFor="projectType" className="text-sm block mb-1">
              Project Type
            </label>
            <input
              id="projectType"
              name="projectType"
              value={form.projectType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-[0_6px_24px_0_var(--theme-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
            />
          </div>

          <div>
            <label htmlFor="budget" className="text-sm block mb-1">
              Budget
            </label>
            <input
              id="budget"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              disabled={!isEditable}
              placeholder="e.g. $3000"
              className={`w-full px-4 py-2 rounded-2xl text-[var(--theme-text)] shadow-[0_6px_24px_0_var(--theme-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 ${
                isEditable
                  ? 'bg-[var(--theme-surface)]'
                  : 'bg-gray-300 cursor-not-allowed opacity-70'
              }`}
            />
            {!isEditable && (
              <p className="text-xs mt-1 text-red-500">
                Budget is locked after 72 hours.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="timeline" className="text-sm block mb-1">
              Timeline
            </label>
            <input
              id="timeline"
              name="timeline"
              value={form.timeline}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_6px_24px_0_var(--theme-shadow)]"
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm block mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={8}
              className="w-full h-72 px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-[0_6px_24px_0_var(--theme-shadow)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 resize-none custom-scrollbar"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--theme-border-red)]/30 p-4 sm:p-6 flex justify-end gap-3 bg-[var(--theme-surface)]">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] cursor-pointer"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-[var(--theme-button-red)] hover:bg-[var(--theme-button-red)]/80 text-[var(--theme-text-white)] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
