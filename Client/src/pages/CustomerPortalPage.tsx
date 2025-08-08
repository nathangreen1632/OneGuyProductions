import React from 'react';
import CustomerPortalView from '../jsx/customerPortalView';
import OrderCardLogic from '../components/OrderCardLogic.tsx';

export default function CustomerPortalPage(): React.ReactElement {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <CustomerPortalView />
      <OrderCardLogic />
    </div>
  );
}
