import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import OrderForm from '../components/OrderForm';
import { useOrderStore } from '../store/useOrderStore';

export default function OrderPage(): React.ReactElement {
  const { pathname } = useLocation();
  const clearOrder = useOrderStore((state) => state.clearOrder);

  useEffect(() => {
    clearOrder();
  }, [clearOrder]);

  return (
    <main className="bg-[var(--theme-bg)] text-[var(--theme-text)] min-h-screen py-15 px-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-10 text-[var(--theme-accent)]">
        Start Your Project
      </h2>
      <OrderForm key={pathname} /> {/* 🔁 Force re-mount on route entry */}
    </main>
  );
}
