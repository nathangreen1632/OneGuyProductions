import React, { type ReactElement, type RefObject, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { ContactPayload, ContactResponse } from '../types/contact.types';
import type { ContactFormData } from '../types/formData.types';
import { useContactStore } from '../store/useContactStore';
import { waitForReCaptchaEnterpriseAndExecute } from '../helpers/waitForRecaptchaEnterpriseHelper';
import ContactFormView from '../jsx/contactFormView';

const initialForm: ContactFormData = {
  name: '',
  email: '',
  message: '',
};

export default function ContactFormLogic(): ReactElement {
  const [formData, setFormData] = useState<ContactFormData>(initialForm);
  const [isRecaptchaReady] = useState<boolean>(true);
  const lockRef: RefObject<boolean> = useRef<boolean>(false);
  const { submitting, setSubmitting } = useContactStore();

  const handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => void = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    if (!name) return;

    if (name in formData) {
      setFormData((prev: ContactFormData): ContactFormData => ({
        ...prev,
        [name as keyof ContactFormData]: value,
      }));
    }
  };

  const handleSubmit: (e: React.FormEvent) => Promise<void> = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    const siteKey: string = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      toast.error('Missing reCAPTCHA key');
      return;
    }

    let captchaToken: string;
    try {
      captchaToken = await waitForReCaptchaEnterpriseAndExecute(siteKey, 'submit_contact_form');
    } catch (err) {
      console.error('❌ Error generating reCAPTCHA token', err);
      toast.error('Captcha error. Please try again.');
      lockRef.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const payload: ContactPayload = { ...formData, captchaToken };

      let res: Response;
      try {
        res = await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('❌ Network error during form submission:', err);
        toast.error('Network error while submitting request.');
        return;
      }

      const result: ContactResponse = await res.json();

      if (!res.ok || !result.success) {
        console.error('⚠️ Server responded with error:', result);
        toast.error(result?.error ?? 'Something went wrong. Please try again.');
      } else {
        toast.success('Message sent successfully!');
        setFormData(initialForm);
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
    <ContactFormView
      formData={formData}
      submitting={submitting}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      isRecaptchaReady={isRecaptchaReady}
    />
  );
}
