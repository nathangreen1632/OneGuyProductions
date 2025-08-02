import React from 'react';
import { useLocation } from 'react-router-dom';
import OrderForm from '../components/OrderForm';

export default function OrderPage(): React.ReactElement {
  const { pathname } = useLocation();

  return (
    <main
      key={pathname}
      className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen py-15 px-6 max-w-3xl mx-auto"
    >
      <h2 className="text-3xl font-bold text-center mb-10 text-[var(--theme-accent)]">
        Start Your Project
      </h2>
      <OrderForm key={pathname} />
    </main>
  );
}
