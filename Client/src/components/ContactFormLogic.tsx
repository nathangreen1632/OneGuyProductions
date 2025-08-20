import React, { type ReactElement, type RefObject, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {type ContactPayload, type ContactResponse, isLikelyEmail} from '../types/contact.types';
import type { ContactFormData } from '../types/formData.types';
import { useContactStore } from '../store/useContact.store';
import { waitForReCaptchaEnterpriseAndExecute } from '../helpers/waitForRecaptchaEnterprise.helper';
import ContactFormView from '../jsx/contactFormView';
import { RECAPTCHA_SITE_KEY } from '../constants/env';

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

  const release: () => void = (): void => {
    lockRef.current = false;
    setSubmitting(false);
  };

  const validate: (d: ContactFormData) => boolean = (d: ContactFormData): boolean => {
    const name: string = (d.name ?? '').trim();
    const email: string = (d.email ?? '').trim();
    const message: string = (d.message ?? '').trim();

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
    if (!message) {
      toast.error('Please enter a message.');
      return false;
    }
    return true;
  };

  const handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void = (
    e: (React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)
  ): void => {
    try {
      const { name, value } = e.target ?? {};
      if (typeof name !== 'string' || !(name in initialForm)) {
        console.warn('ContactForm: unknown field change ignored.', name);
        return;
      }
      setFormData((prev: ContactFormData): ContactFormData => ({
        ...prev,
        [name]: String(value ?? ''),
      }) as ContactFormData);
    } catch (err) {
      console.error('ContactForm: handleChange failed.', err);
      toast.error('Could not update the form field.');
    }
  };

  const handleSubmit: (e: React.FormEvent) => Promise<void> = async (e: React.FormEvent): Promise<void> => {
    try {
      e.preventDefault();

      if (lockRef.current || submitting) {
        console.warn('ContactForm: submission blocked (already submitting).');
        toast.error('Please wait… already submitting.');
        return;
      }

      if (!validate(formData)) return;

      if (!RECAPTCHA_SITE_KEY) {
        console.error('ContactForm: missing VITE_RECAPTCHA_SITE_KEY.');
        toast.error('Internal error: reCAPTCHA not configured.');
        return;
      }

      lockRef.current = true;
      setSubmitting(true);

      let captchaToken: string;
      try {
        captchaToken = await waitForReCaptchaEnterpriseAndExecute(RECAPTCHA_SITE_KEY, 'submit_contact_form');
      } catch (err) {
        console.error('ContactForm: error generating reCAPTCHA token.', err);
        toast.error('Captcha error. Please try again.');
        return;
      }

      const payload: ContactPayload = { ...formData, captchaToken };

      const controller = new AbortController();
      const timer: number = setTimeout(() => controller.abort(), 20_000);

      let res: Response;
      try {
        res = await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          console.error('ContactForm: request timed out.');
          toast.error('Request timed out. Please try again.');
        } else {
          console.error('ContactForm: network error during submission.', err);
          toast.error('Network error while submitting. Please check your connection.');
        }
        return;
      } finally {
        clearTimeout(timer);
      }

      let result: ContactResponse | null;
      try {
        result = (await res.json()) as ContactResponse;
      } catch {
        result = null;
      }

      if (!res.ok || !result?.success) {
        const msg: string =
          (result && typeof result.error === 'string' && result.error) ||
          `Submission failed (HTTP ${res.status}).`;
        console.warn('ContactForm: server reported error.', { status: res.status, msg, result });
        toast.error(msg);
        return;
      }

      toast.success('Message sent successfully!');
      setFormData(initialForm);
    } catch (err) {
      console.error('ContactForm: unexpected error in handleSubmit.', err);
      toast.error('Unexpected error. Please try again.');
    } finally {
      release();
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
