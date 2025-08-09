import React from 'react';

export default function NotificationBadge(): React.ReactElement {
  return (
    <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[var(--theme-border-red)] shadow-[0_0_0_2px_var(--theme-shadow)]" />
  );
}
