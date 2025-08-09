import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useEditOrderStore } from '../store/useEditOrderStore';
import EditOrderModalView from '../jsx/editOrderModalView';
import type { EditOrderForm } from '../types/editOrderForm.types';

export interface TEditOrderFormType {
  description: string;
  timeline: string;
  budget: string;
  projectType: string;
  businessName: string;
}

export default function EditOrderModal(): React.ReactElement | null {
  const { modalOpen, targetOrder, closeModal, refreshOrders } = useEditOrderStore();
  const [loading, setLoading] = useState<boolean>(false);

  const [form, setForm] = useState<EditOrderForm>({
    description: '',
    timeline: '',
    budget: '',
    projectType: '',
    businessName: '',
  });

  useEffect((): void => {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (): Promise<void> => {
    if (!targetOrder) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/order/${targetOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Order updated successfully.');
        closeModal();
        refreshOrders();
      } else {
        toast.error(data.error || 'Failed to update order.');
      }
    } catch {
      toast.error('Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EditOrderModalView
      modalOpen={modalOpen}
      closeModal={closeModal}
      form={form}
      loading={loading}
      handleChange={handleChange}
      handleSave={handleSave}
    />
  );
}
