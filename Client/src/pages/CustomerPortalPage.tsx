import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CustomerPortalView from '../jsx/customerPortalView';
import ThreadReplyModalLogic from '../components/ThreadReplyModalLogic';
import { useThreadModalStore } from '../store/useThreadModalStore';

export default function CustomerPortalPage(): React.ReactElement {
  const { search } = useLocation();
  const { open } = useThreadModalStore();

  useEffect((): void => {
    const params = new URLSearchParams(search);
    const idParam: string | null = params.get('openOrder');
    if (!idParam) return;
    const num: number = Number(idParam);
    if (Number.isFinite(num) && num > 0) {
      open(num);
    }
  }, [search, open]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <CustomerPortalView />
      <ThreadReplyModalLogic />
    </div>
  );
}
