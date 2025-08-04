import React, { type ReactElement, type RefObject, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { DerivedOrderFormData, OrderFormData, OrderPayload, OrderResponse } from '../types/order';
import { useOrderStore } from '../store/useOrderStore';
import { executeRecaptchaFlow } from '../utils/recaptchaHandler';
import OrderFormView from '../jsx/orderFormView';

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    if (!name) return;

    if (name in formData) {
      setFormData((prev) => ({
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
      const captchaToken = await executeRecaptchaFlow('submit_order_form');
      if (!captchaToken) return;

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
    <OrderFormView
      formData={formData}
      submitting={submitting}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
    />
  );
}
