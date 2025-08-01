import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ContactForm from '../components/ContactForm';
import { useContactStore } from '../store/useContactStore';

export default function ContactPage(): React.ReactElement {
  const { pathname } = useLocation();
  const setSubmitting = useContactStore((state) => state.setSubmitting);

  useEffect(() => {
    setSubmitting(false);
  }, [setSubmitting]);

  return (
    <div className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen py-16 px-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10 text-[var(--theme-accent)]">Let's Chat</h2>
      <ContactForm key={pathname} /> {/* 🔁 Force re-mount on route entry */}
    </div>
  );
}
