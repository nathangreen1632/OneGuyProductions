import React from 'react';

interface ModalIconButtonProps {
  ariaLabel: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function ModalIconButton({
                                          ariaLabel,
                                          onClick,
                                          className,
                                          disabled,
                                          children,
                                        }: Readonly<ModalIconButtonProps>): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={className ?? 'p-1 rounded hover:opacity-80 focus:outline-none'}
    >
      {children}
    </button>
  );
}
