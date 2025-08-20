import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import CustomerPortalView from '../jsx/customerPortalView';
import ThreadReplyModalLogic from '../components/ThreadReplyModalLogic';
import { useThreadModalStore } from '../store/useThreadModal.store';

const LOG_PREFIX = 'CustomerPortalPage';

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const s: string = value.trim();

  for (let i: number = 0; i < s.length; i += 1) {
    const c: number = s.charCodeAt(i);
    if (c < 48 || c > 57) return null;
  }
  const n: number = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function CustomerPortalPage(): React.ReactElement {
  const { search } = useLocation();
  const { open } = useThreadModalStore();

  useEffect((): void => {
    try {
      const params = new URLSearchParams(search ?? '');
      const idParam: string | null = params.get('openOrder');
      const orderId: number | null = parsePositiveInt(idParam);

      if (orderId == null) {
        if (idParam) {
          toast('We couldn’t open that order. The link looks invalid.', { icon: 'ℹ️' });
          console.warn(`${LOG_PREFIX}: invalid openOrder param`, { idParam });
        }
        return;
      }

      try {
        open(orderId);
      } catch (err) {
        console.error(`${LOG_PREFIX}: open(orderId) threw`, err);
        toast.error('We found your order ID, but could not open it. Please try again from the list.');
      }
    } catch (err) {
      console.error(`${LOG_PREFIX}: failed to parse query string`, err);
      toast.error('We couldn’t read the link parameters. Please try reloading the page.');
    }
  }, [search, open]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <CustomerPortalView />
      <ThreadReplyModalLogic />
    </div>
  );
}
