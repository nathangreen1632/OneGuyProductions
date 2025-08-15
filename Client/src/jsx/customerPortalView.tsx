import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import ToggleViewButton from '../common/ToggleViewButton';
import OrderCardLogic from '../components/OrderCardLogic';
import OrderTimelineLogic from '../components/OrderTimelineLogic';

export default function CustomerPortalView(): React.ReactElement {
  const { currentView, fetchOrders } = useOrderStore();
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      try {
        await fetchOrders();
      } catch (error) {
        console.error('❌ Failed to fetch orders:', error);
      }
    })();
  }, [fetchOrders]);

  // Scroll to #order-<id> and blink its border 3x (card or timeline)
  useEffect(() => {
    const id = (loc.hash || '').replace(/^#/, '');
    if (!id) return;

    const el = document.getElementById(id);
    if (!el) return;

    // scroll into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // remove any solid ring that could mask the blink
    el.classList.remove('ring-2', 'ring-[var(--theme-border-red)]');

    // base border must be transparent while the animation owns the color
    el.classList.add('border-transparent', 'ogp-blink-border-3');

    const handleEnd = () => {
      el.classList.remove('ogp-blink-border-3', 'border-transparent');
      // underlying class (border-[var(--theme-border)]) stays intact
    };

    el.addEventListener('animationend', handleEnd, { once: true });
    return () => {
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
