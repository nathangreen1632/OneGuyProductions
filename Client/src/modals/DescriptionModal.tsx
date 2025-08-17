import React, {type RefObject, useEffect, useRef} from 'react';
import { createPortal } from 'react-dom';
import DescriptionModalView from '../jsx/modalView/descriptionModalView.tsx';

interface DescriptionModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function generateSecureId(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0].toString(36);
}

export default function DescriptionModal({
                                           open,
                                           title,
                                           onClose,
                                           children,
                                         }: Readonly<DescriptionModalProps>): React.ReactElement | null {
  const panelRef: RefObject<HTMLDialogElement | null> = useRef<HTMLDialogElement | null>(null);
  const titleId: string = useRef(`dialog-title-${generateSecureId()}`).current;

  useEffect((): (() => void) | undefined => {
    if (!open) return;
    const prev: string = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return (): void => { document.documentElement.style.overflow = prev; };
  }, [open]);

  useEffect((): (() => void) | undefined => {
    const dlg: HTMLDialogElement | null = panelRef.current;
    if (!dlg) return;

    if (open) {
      const handleCancel: (e: Event) => void = (e: Event): void => { e.preventDefault(); onClose(); };
      const handleClose: () => void = (): void => { onClose(); };

      dlg.addEventListener('cancel', handleCancel);
      dlg.addEventListener('close', handleClose);

      if (!dlg.open) dlg.showModal();
      requestAnimationFrame(() => dlg.focus());

      return () => {
        dlg.removeEventListener('cancel', handleCancel);
        dlg.removeEventListener('close', handleClose);
      };
    } else if (dlg.open) dlg.close();
  }, [open, onClose]);

  useEffect((): (() => void) | undefined => {
    if (!open) return;
    const onKey: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return (): void => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick: () => void = (): void => { onClose(); };
  const onBackdropKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <DescriptionModalView
      title={title}
      titleId={titleId}
      onClose={onClose}
      onBackdropClick={onBackdropClick}
      onBackdropKeyDown={onBackdropKeyDown}
      panelRef={panelRef}
    >
      {children}
    </DescriptionModalView>,
    document.body
  );
}
