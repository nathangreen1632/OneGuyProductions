import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DescriptionModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function DescriptionModal({
                                           open,
                                           title,
                                           onClose,
                                           children,
                                         }: Readonly<DescriptionModalProps>): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus into the panel for better a11y
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
      onClick={onClose} // backdrop click
    >
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative bg-[var(--theme-surface)] text-[var(--theme-text)]
                   w-full max-w-2xl rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)]
                   border border-[var(--theme-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // prevent backdrop close
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--theme-border-red)]/30">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:opacity-80 focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[70vh] overflow-y-auto text-sm leading-6 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--theme-border-red)]/30 bg-[var(--theme-surface)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-[var(--theme-button)] text-[var(--theme-text-white)]
                       hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2
                       focus:ring-[var(--theme-focus)]/60 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
