import React, { type ReactElement, type RefObject, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { DerivedOrderFormData, OrderFormData, OrderPayload, OrderResponse } from '../types/order.types';
import { isLikelyEmail } from '../types/contact.types';
import { useOrderStore } from '../store/useOrder.store';
import { useSignupPromptStore } from '../store/useSignupPrompt.store';
import { executeRecaptchaFlow } from '../helpers/recaptchaHandle.helper';
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

  const validate = (d: OrderFormData): boolean => {
    const name = (d.name ?? '').trim();
    const email = (d.email ?? '').trim();
    const description = (d.description ?? '').trim();

    if (!name) {
      toast.error('Please enter your name.');
      return false;
    }
    if (!email) {
      toast.error('Please enter your email.');
      return false;
    }
    if (!isLikelyEmail(email)) {
      toast.error('That email address looks invalid.');
      return false;
    }
    if (!description) {
      toast.error('Please describe your project.');
      return false;
    }
    return true;
  };

  const handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void = (e): void => {
    try {
      const { name, value } = e.target ?? {};
      if (typeof name !== 'string' || !(name in initialForm)) {
        console.warn('OrderForm: unknown field change ignored.', name);
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: String(value ?? '') }) as OrderFormData);
    } catch (err) {
      console.error('OrderForm: handleChange failed.', err);
      toast.error('Could not update the form field.');
    }
  };

  const handleSubmit: (e: React.FormEvent) => Promise<void> = async (e): Promise<void> => {
    try {
      e.preventDefault();

      if (lockRef.current || submitting) {
        console.warn('OrderForm: submission blocked (already submitting).');
        toast.error('Please wait… already submitting.');
        return;
      }

      if (!validate(formData)) return;

      lockRef.current = true;
      setSubmitting(true);

      // 1) reCAPTCHA
      let captchaToken: string | null = null;
      try {
        captchaToken = await executeRecaptchaFlow('submit_order_form');
      } catch (err) {
        console.error('OrderForm: reCAPTCHA flow errored.', err);
        toast.error('Captcha error. Please try again.');
        return;
      }
      if (!captchaToken) {
        console.warn('OrderForm: captcha token missing.');
        toast.error('Captcha verification failed. Please try again.');
        return;
      }

      // 2) Build payload
      const payload: OrderPayload = { ...formData, captchaToken };

      // 3) Submit to API with timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);

      let res: Response;
      try {
        res = await fetch('/api/order/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          console.error('OrderForm: request timed out.');
          toast.error('Request timed out. Please try again.');
        } else {
          console.error('OrderForm: network error during submission.', err);
          toast.error('Network error while submitting. Please check your connection.');
        }
        return;
      } finally {
        clearTimeout(timer);
      }

      // 4) Handle response
      if (res.ok) {
        let result: OrderResponse | null;
        try {
          result = (await res.json()) as OrderResponse;
        } catch {
          result = null; // tolerate empty/invalid JSON
        }

        toast.success('Your request was submitted successfully!');
        try {
          setLastOrder(payload);
        } catch (err) {
          console.warn('OrderForm: failed to save last order to store.', err);
        }

        // Prompt signup for unknown email (best effort)
        try {
          const email = (formData.email ?? '').trim();
          if (
            result?.unknownEmail &&
            result?.orderId &&
            email &&
            !useSignupPromptStore.getState().wasPrompted(email)
          ) {
            useSignupPromptStore.getState().openPrompt(email, result.orderId);
          }
        } catch (err) {
          console.warn('OrderForm: signup prompt flow failed.', err);
        }

        try {
          clearOrder();
        } catch (err) {
          console.warn('OrderForm: clearOrder store call failed.', err);
        }
        setFormData(initialForm);
        return;
      }

      // Non-OK: try to parse error and present something useful
      let result: OrderResponse | null = null;
      try {
        result = (await res.json()) as OrderResponse;
        console.warn('OrderForm: server responded with error.', { status: res.status, result });
      } catch (jsonErr) {
        console.error('OrderForm: failed to parse error response.', jsonErr);
      }

      const fallback = `Submission failed (HTTP ${res.status}).`;
      const msg =
        (result && typeof result.error === 'string' && result.error) ||
        (result && typeof (result as any).message === 'string' && (result as any).message) ||
        fallback;

      toast.error(msg);
    } catch (err) {
      console.error('OrderForm: unexpected failure during submission.', err);
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
