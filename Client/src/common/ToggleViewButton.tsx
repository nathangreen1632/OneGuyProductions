import React from 'react';
import { useOrderStore } from '../store/useOrderStore.ts';
import { LayoutGrid, List } from 'lucide-react';

export default function ToggleViewButton(): React.ReactElement {
  const { currentView, setView } = useOrderStore();

  const toggleView = (): void => {
    setView(currentView === 'card' ? 'timeline' : 'card');
  };

  const Icon = currentView === 'card' ? List : LayoutGrid;
  const nextView = currentView === 'card' ? 'Timeline' : 'Card';

  return (
    <button
      onClick={toggleView}
      aria-label={`Switch to ${nextView} view`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--theme-button)] text-[var(--theme-text-white)] shadow-md hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 transition"
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium hidden sm:inline">
        {nextView} View
      </span>
    </button>
  );
}
