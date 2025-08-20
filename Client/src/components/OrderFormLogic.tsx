import React, {type ReactElement, type RefObject, useRef, useState} from 'react';
import toast from 'react-hot-toast';
import type {DerivedOrderFormData, OrderFormData, OrderPayload, OrderResponse} from '../types/order.types';
import {isLikelyEmail} from '../types/contact.types';
import {useOrderStore} from '../store/useOrder.store';
import {useSignupPromptStore} from '../store/useSignupPrompt.store';
import {executeRecaptchaFlow} from '../helpers/recaptchaHandle.helper';
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

  const validate: (d: OrderFormData) => boolean = (d: OrderFormData): boolean => {
    const name: string = (d.name ?? '').trim();
    const email: string = (d.email ?? '').trim();
    const description: string = (d.description ?? '').trim();

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
  ) => void = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    try {
      const { name, value } = e.target ?? {};
      if (typeof name !== 'string' || !(name in initialForm)) {
        console.warn('OrderForm: unknown field change ignored.', name);
        return;
      }
      setFormData((prev: OrderFormData): OrderFormData => ({ ...prev, [name]: String(value ?? '') }) as OrderFormData);
    } catch (err) {
      console.error('OrderForm: handleChange failed.', err);
      toast.error('Could not update the form field.');
    }
  };

  function isLocked(): boolean {
    if (lockRef.current || submitting) {
      console.warn('OrderForm: submission blocked (already submitting).');
      toast.error('Please wait… already submitting.');
      return true;
    }
    return false;
  }

  function buildPayload(captchaToken: string): OrderPayload {
    return { ...formData, captchaToken };
  }

  async function getCaptcha(): Promise<string | null> {
    try {
      const token: string | null = await executeRecaptchaFlow('submit_order_form');
      if (!token) {
        console.warn('OrderForm: captcha token missing.');
        toast.error('Captcha verification failed. Please try again.');
        return null;
      }
      return token;
    } catch (err) {
      console.error('OrderForm: reCAPTCHA flow errored.', err);
      toast.error('Captcha error. Please try again.');
      return null;
    }
  }

  async function postOrder(payload: OrderPayload): Promise<Response | null> {
    const controller = new AbortController();
    const timer: number = setTimeout((): void => controller.abort(), 30_000);

    try {
      return await fetch('/api/order/submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
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
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function safeJson<T>(res: Response): Promise<T | null> {
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  function afterSuccess(payload: OrderPayload, result: OrderResponse | null): void {
    toast.success('Your request was submitted successfully!');

    try {
      setLastOrder(payload);
    } catch (err) {
      console.warn('OrderForm: failed to save last order to store.', err);
    }

    try {
      const email: string = (formData.email ?? '').trim();
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
  }

  async function handleNonOk(res: Response): Promise<void> {
    let result: OrderResponse | null = null;
    try {
      result = await safeJson<OrderResponse>(res);
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
  }

  const handleSubmit: (e: React.FormEvent) => Promise<void> = async (e: React.FormEvent): Promise<void> => {
    try {
      e.preventDefault();

      if (isLocked()) return;
      if (!validate(formData)) return;

      lockRef.current = true;
      setSubmitting(true);

      const captchaToken: string | null = await getCaptcha();
      if (!captchaToken) return;

      const payload: OrderPayload = buildPayload(captchaToken);
      const res: Response | null = await postOrder(payload);
      if (!res) return;

      if (res.ok) {
        const result: OrderResponse | null = await safeJson<OrderResponse>(res);
        afterSuccess(payload, result);
        return;
      }

      await handleNonOk(res);
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
