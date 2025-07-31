import React from 'react';
import ContactForm from '../components/ContactForm';

export default function ContactPage(): React.ReactElement {
  return (
    <div className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen py-16 px-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10 text-[var(--theme-accent)]">Let's Chat</h2>
      <ContactForm />
    </div>
  );
}
