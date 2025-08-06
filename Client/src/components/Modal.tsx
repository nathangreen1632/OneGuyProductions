import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({
                                isOpen,
                                onClose,
                                title,
                                children,
                              }: ModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 sm:px-0">
      <div className="bg-[var(--theme-surface)] rounded-xl shadow-2xl w-full max-w-md p-6 text-[var(--theme-text)] relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-xl focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>

        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
