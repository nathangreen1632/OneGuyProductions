console.log('📝 ContactForm initialized');

import React, {
  type ReactElement,
  type RefObject,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import type { ContactPayload, ContactResponse } from '../types/contact';
import type { ContactFormData } from '../types/formData';
import { useContactStore } from '../store/useContactStore';
import ContactFormView from '../jsx/contactFormView';
import { waitForReCaptchaEnterpriseAndExecute } from '../utils/waitForRecaptchaEnterprise'; // ✅ New helper

const initialForm: ContactFormData = {
  name: '',
  email: '',
  message: '',
};

export default function ContactForm(): ReactElement {
  const [formData, setFormData] = useState<ContactFormData>(initialForm);
  const [isRecaptchaReady] = useState<boolean>(true); // ✅ always true since we poll on submit
  const lockRef: RefObject<boolean> = useRef<boolean>(false);
  const { submitting, setSubmitting } = useContactStore();

  const handleChange = (
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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    console.log('🚀 Submitting form...');
    e.preventDefault();
    if (lockRef.current || submitting) return;

    lockRef.current = true;
    setSubmitting(true);

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      toast.error('Missing reCAPTCHA key');
      return;
    }

    let captchaToken: string;
    try {
      captchaToken = await waitForReCaptchaEnterpriseAndExecute(siteKey, 'submit_contact_form');
      console.log('✅ Captcha token received');
    } catch (err) {
      console.error('❌ Error generating reCAPTCHA token', err);
      toast.error('Captcha error. Please try again.');
      lockRef.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const payload: ContactPayload = { ...formData, captchaToken };
      console.log('📦 Step 3: Sending payload to backend...', payload);

      let res: Response;
      try {
        res = await fetch('/api/contact/submit', {
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
      const result: ContactResponse = await res.json();

      if (!res.ok || !result.success) {
        console.error('⚠️ Server responded with error:', result);
        toast.error(result?.error ?? 'Something went wrong. Please try again.');
      } else {
        console.log('✅ Step 4 complete: Success response received');
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
