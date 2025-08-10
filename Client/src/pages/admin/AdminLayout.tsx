import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AdminLayout(): React.ReactElement {

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
