// Client/src/components/EditOrderModal.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { useEditOrderStore } from '../store/useEditOrderStore';

export default function EditOrderModal(): React.ReactElement | null {
  const { modalOpen, targetOrder, closeModal, refreshOrders } = useEditOrderStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    description: '',
    timeline: '',
    budget: '',
    projectType: '',
    businessName: '',
  });

  useEffect(() => {
    if (targetOrder) {
      setForm({
        description: targetOrder.description ?? '',
        timeline: targetOrder.timeline ?? '',
        budget: targetOrder.budget ?? '',
        projectType: targetOrder.projectType ?? '',
        businessName: targetOrder.businessName ?? '',
      });
    }
  }, [targetOrder]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (): Promise<void> => {
    if (!targetOrder) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${targetOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Order updated successfully.');
        closeModal();
        refreshOrders(); // Trigger store reload or hard refresh
      } else {
        toast.error(data.error || 'Failed to update order.');
      }
    } catch (err) {
      console.error('❌ Edit failed:', err);
      toast.error('Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={modalOpen} onClose={closeModal} title="Edit Order">
      <div className="flex flex-col gap-4">
        <input
          name="projectType"
          placeholder="Project Type"
          className="input"
          value={form.projectType}
          onChange={handleChange}
        />
        <input
          name="budget"
          placeholder="Budget"
          className="input"
          value={form.budget}
          onChange={handleChange}
        />
        <input
          name="timeline"
          placeholder="Timeline"
          className="input"
          value={form.timeline}
          onChange={handleChange}
        />
        <input
          name="businessName"
          placeholder="Business Name"
          className="input"
          value={form.businessName}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Project Description"
          className="input h-24 resize-none"
          value={form.description}
          onChange={handleChange}
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-500 text-white rounded"
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
    </Modal>
  );
}
