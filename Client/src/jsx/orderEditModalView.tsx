import React, { useState, useEffect } from 'react';
import type { Order } from '../types/order';
import { isWithin72Hours } from '../helpers/dateHelper.ts';

interface Props {
  order: Order;
  onClose: () => void;
  onSave: (updatedOrder: Partial<Order>) => void;
}

export default function OrderEditModalView({
                                         order,
                                         onClose,
                                         onSave,
                                       }: Readonly<Props>): React.ReactElement {
  const [form, setForm] = useState({
    businessName: order.businessName,
    projectType: order.projectType,
    budget: order.budget,
    timeline: order.timeline,
    description: order.description,
  });

  const isEditable = isWithin72Hours(order.createdAt);

  useEffect(() => {
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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (): void => {
    onSave({ ...order, ...form });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-[var(--theme-surface)] text-[var(--theme-text)] w-full max-w-lg rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] p-6">
        <h2 className="text-xl font-bold mb-4">Edit Order</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="businessName" className="text-sm text-[var(--theme-text)] block mb-1">
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)] overflow-hidden"
            />
          </div>

          <div>
            <label htmlFor="projectType" className="text-sm text-[var(--theme-text)] block mb-1">
              Project Type
            </label>
            <input
              id="projectType"
              name="projectType"
              value={form.projectType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)] overflow-hidden"
            />
          </div>

          <div>
            <label htmlFor="budget" className="text-sm text-[var(--theme-text)] block mb-1">
              Budget
            </label>
            <input
              id="budget"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              disabled={!isEditable}
              placeholder="e.g. $3000"
              className={`w-full px-4 py-2 rounded-2xl text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)] overflow-hidden ${
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
            <label htmlFor="timeline" className="text-sm text-[var(--theme-text)] block mb-1">
              Timeline
            </label>
            <input
              id="timeline"
              name="timeline"
              value={form.timeline}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)] overflow-hidden"
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm text-[var(--theme-text)] block mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] placeholder:text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_0_var(--theme-shadow)] cursor-pointer hover:shadow-[0_0_25px_2px_var(--theme-shadow)] overflow-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-gray-600 hover:bg-gray-700 text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] shadow focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
