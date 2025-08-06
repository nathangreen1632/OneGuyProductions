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

  const childArray = React.Children.toArray(children);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 sm:px-0">
      <div className="relative w-full max-w-2xl sm:max-w-3xl rounded-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-[0_0_25px_2px_var(--theme-shadow)] p-6 sm:p-8 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/40">

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
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--theme-accent)] mb-6 text-center">
            {title}
          </h3>
        )}

        {/* Each Child Section in a Themed Box */}
        <div className="space-y-4">
          {childArray.map((child, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)]  shadow-[0_4px_14px_0_var(--theme-shadow)] text-[var(--theme-text)]"
            >
              {/* Automatically wrap basic input-like elements */}
              {typeof child === 'string' ? (
                <p className="text-base">{child}</p>
              ) : (
                child
              )}
            </div>
          ))}
        </div>

      </div>
    </div>,
    document.body
  );
}
