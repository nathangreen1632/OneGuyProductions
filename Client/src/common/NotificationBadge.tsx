import React from 'react';

export default function NotificationBadge(): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-2 -right-2 h-3 w-3 rounded-full
                 bg-[var(--theme-border-red)] ring-2 ring-[var(--theme-surface)]
                 pointer-events-none inline-block"
    />
  );
}
