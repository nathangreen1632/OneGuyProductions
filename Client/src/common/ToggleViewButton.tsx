import React from 'react';
import { useOrderStore } from '../store/useOrder.store';
import { LayoutGrid, List } from 'lucide-react';

export default function ToggleViewButton(): React.ReactElement {
  const { currentView, setView } = useOrderStore();

  const toggleView: () => void = (): void => {
    setView(currentView === 'card' ? 'timeline' : 'card');
  };

  const Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> =
    currentView === 'card' ? List : LayoutGrid;

  const nextView: 'Timeline' | 'Card' =
    currentView === 'card' ? 'Timeline' : 'Card';

  return (
    <button
      onClick={toggleView}
      aria-label={`Switch to ${nextView} view`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--theme-button)] text-[var(--theme-text-white)] shadow-md hover:bg-[var(--theme-hover)] transition"
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium hidden sm:inline cursor-pointer">
        {nextView} View
      </span>
    </button>
  );
}
