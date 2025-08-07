import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function TimelineEditModal({
                                            isOpen,
                                            onClose,
                                            title,
                                            children,
                                          }: ModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="relative bg-[var(--theme-surface)] text-[var(--theme-text)] w-full max-w-lg rounded-2xl shadow-[0_4px_14px_0_var(--theme-shadow)] p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--theme-border-red)] text-xl font-bold hover:text-red-700 focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Modal Title */}
        {title && (
          <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
        )}

        {/* Directly Render Children */}
        <div className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
