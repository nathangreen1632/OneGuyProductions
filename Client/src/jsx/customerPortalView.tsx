import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOrderStore } from '../store/useOrder.store';
import ToggleViewButton from '../common/ToggleViewButton';
import OrderCardLogic from '../components/OrderCardLogic';
import OrderTimelineLogic from '../components/OrderTimelineLogic';

export default function CustomerPortalView(): React.ReactElement {
  const { currentView, fetchOrders } = useOrderStore();
  const loc = useLocation();

  useEffect((): void => {
    (async (): Promise<void> => {
      try {
        await fetchOrders();
      } catch (error) {
        console.error('❌ Failed to fetch orders:', error);
      }
    })();
  }, [fetchOrders]);

  useEffect((): (() => void) | undefined => {
    const id: string = (loc.hash || '').replace(/^#/, '');
    if (!id) return;

    const el: HTMLElement | null = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    el.classList.remove('ring-2', 'ring-[var(--theme-border-red)]');

    el.classList.add('border-transparent', 'ogp-blink-border-3');

    const handleEnd: () => void = (): void => {
      el.classList.remove('ogp-blink-border-3', 'border-transparent');
    };

    el.addEventListener('animationend', handleEnd, { once: true });
    return (): void => {
      el.classList.remove('ogp-blink-border-3', 'border-transparent');
      el.removeEventListener('animationend', handleEnd as any);
    };
  }, [loc.hash, currentView]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">My Orders</h2>
        <ToggleViewButton />
      </div>
      {currentView === 'card' ? <OrderCardLogic /> : <OrderTimelineLogic />}
    </div>
  );
}
