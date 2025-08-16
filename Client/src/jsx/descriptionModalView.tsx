import React from 'react';
import { X } from 'lucide-react';
import ModalIconButton from '../common/ModalIconButton';
import ModalActionButton from '../common/ModalActionButton';

export interface DescriptionModalViewProps {
  title: string;
  titleId: string;
  children: React.ReactNode;

  onClose: () => void;
  onBackdropClick: () => void;
  onBackdropKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;

  panelRef: React.RefObject<HTMLDialogElement | null>;
}

export default function DescriptionModalView({
                                               title,
                                               titleId,
                                               children,
                                               onClose,
                                               onBackdropClick,
                                               onBackdropKeyDown,
                                               panelRef,
                                             }: Readonly<DescriptionModalViewProps>): React.ReactElement {
  return (
    <dialog
      ref={panelRef}
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="
        fixed inset-0 m-auto
        w-[92vw] sm:w-[90vw] md:w-[640px] lg:w-[720px]
        h-[60svh] max-h-[90svh] md:h-[65svh] md:max-h-[88svh]
        bg-[var(--theme-surface)] text-[var(--theme-text)]
        border border-[var(--theme-border)]
        rounded-xl sm:rounded-2xl
        shadow-[0_4px_14px_0_var(--theme-shadow)]
        overflow-hidden
        flex flex-col
      "
    >
      {/* invisible backdrop handler for a11y */}
      <button
        type="button"
        aria-label="Close dialog backdrop"
        onClick={onBackdropClick}
        onKeyDown={onBackdropKeyDown}
        className="sr-only"
      />

      {/* header */}
      <div
        className="
          sticky top-0 z-10
          flex items-center justify-between
          px-3 py-2 sm:px-4 sm:py-3
          border-b border-[var(--theme-border-red)]/30
          bg-[var(--theme-surface)]
        "
      >
        <h2 id={titleId} className="text-base sm:text-lg font-bold">
          {title}
        </h2>
        <ModalIconButton
          ariaLabel="Close"
          onClick={onClose}
          className="p-2 rounded-xl hover:opacity-80"
        >
          <X className="h-5 w-5 text-red-500" />
        </ModalIconButton>
      </div>

      {/* content (scrolls) */}
      <div
        className="
          flex-1 min-h-0
          p-3 sm:p-4
          overflow-y-auto
          text-sm sm:text-base leading-6
          custom-scrollbar
        "
      >
        {children}
      </div>

      {/* footer */}
      <div
        className="
          sticky bottom-0 z-10
          px-3 py-3 sm:px-4 sm:py-3
          border-t border-[var(--theme-border-red)]/30
          bg-[var(--theme-surface)]
          flex justify-end
        "
      >
        <div className="w-full sm:w-auto">
          <ModalActionButton
            onClick={onClose}
            className="
              w-full sm:w-auto
              px-4 py-2
              rounded-xl
              bg-[var(--theme-button)]
              text-[var(--theme-text-white)]
              hover:bg-[var(--theme-hover)]
              text-sm sm:text-base
            "
          >
            Close
          </ModalActionButton>
        </div>
      </div>
    </dialog>
  );
}
