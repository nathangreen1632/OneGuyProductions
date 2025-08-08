import React, { type ReactElement, type RefObject, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { DerivedOrderFormData, OrderFormData, OrderPayload, OrderResponse } from '../types/order';
import { useSignupPromptStore } from '../store/useSignupPromptStore';
import { useOrderStore } from '../store/useOrderStore';
import { executeRecaptchaFlow } from '../helpers/recaptchaHandlerHelper.ts';
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

export default function OrderFormLogic(): ReactElement {
  const [formData, setFormData] = useState<OrderFormData>(initialForm);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const lockRef: RefObject<boolean> = useRef<boolean>(false);
  const { setLastOrder, clearOrder } = useOrderStore();

  const handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => void = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    if (!name) return;

    if (name in formData) {
      setFormData((prev: OrderFormData): OrderFormData => ({
        ...prev,
        [name as keyof OrderFormData]: value,
      }));
    }
  };

  const handleSubmit: ((e: React.FormEvent) => Promise<void>) = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    try {
      const captchaToken: string | null = await executeRecaptchaFlow('submit_order_form');
      if (!captchaToken) return;

      const payload: OrderPayload = { ...formData, captchaToken };

      let res: Response;
      try {
        res = await fetch('/api/order/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('❌ Network error during form submission:', err);
        toast.error('Network error while submitting request.');
        return;
      }

      if (res.ok) {
        const result = await res.json().catch(() => null); // ✅ parse success body
        toast.success('Your request was submitted successfully!');
        setLastOrder(payload);

        // 🚀 NEW: Only prompt if backend says this is an unknown email AND we haven't asked before
        if (result?.unknownEmail && result?.orderId && !useSignupPromptStore.getState().wasPrompted(formData.email)) {
          useSignupPromptStore.getState().openPrompt(formData.email, result.orderId);
        }
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
