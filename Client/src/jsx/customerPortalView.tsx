import React, { useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import ToggleViewButton from '../components/ToggleViewButton';
import OrderLogic from '../components/OrderLogic';              // ✅ container component
import OrderTimelineView from './orderTimelineView';

export default function CustomerPortalView(): React.ReactElement {
  const { currentView, fetchOrders } = useOrderStore();

  useEffect(() => {
    (async () => {
      try {
        await fetchOrders();
      } catch (error) {
        console.error('❌ Failed to fetch orders:', error);
      }
    })();
  }, [fetchOrders]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Orders</h2>
        <ToggleViewButton />
      </div>
      {currentView === 'card' ? <OrderLogic /> : <OrderTimelineView />}
    </div>
  );
}
