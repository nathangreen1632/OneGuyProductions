import React from 'react';

interface ModalActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function ModalActionButton({
                                            onClick,
                                            children,
                                            className,
                                            disabled,
                                          }: Readonly<ModalActionButtonProps>): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        className ??
        'px-4 py-2 rounded bg-[var(--theme-button)] text-[var(--theme-text-white)] hover:bg-[var(--theme-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 text-sm'
      }
    >
      {children}
    </button>
  );
}
