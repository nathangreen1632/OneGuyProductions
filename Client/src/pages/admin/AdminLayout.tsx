import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAdminUiStore } from '../../store/useAdminUiStore.ts';
import { useAdminStore } from '../../store/useAdminStore.ts';

export default function AdminLayout(): React.ReactElement {
  const { polling } = useAdminUiStore();
  const { fetchList } = useAdminStore();
  const loc = useLocation();

  useEffect((): () => void => {
    let timer: number | undefined;
    const tick: () => Promise<void> = async () => {
      await fetchList({});
      if (polling && document.visibilityState === 'visible') {
        timer = window.setTimeout(tick, 20000);
      }
    };
    void tick();
    return (): void => { if (timer) window.clearTimeout(timer); };
  }, [polling, loc.pathname, fetchList]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
      <main className="mx-auto max-w-7xl p-3 sm:p-6">
        <div
          className="
            rounded-2xl
            bg-[var(--theme-surface)]
            shadow-[0_4px_14px_0_var(--theme-shadow)]
            overflow-hidden
          "
        >
          {/* Accent bar */}
          <div className="h-1 w-full" />
          <div className="p-3 sm:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
