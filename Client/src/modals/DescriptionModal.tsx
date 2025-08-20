import React, { type RefObject, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DescriptionModalView from '../jsx/modalView/descriptionModalView';

interface DescriptionModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const LOG_PREFIX = 'DescriptionModal';

function safeId(): string {
  try {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const arr = new Uint32Array(2);
      window.crypto.getRandomValues(arr);
      return `${arr[0].toString(36)}-${arr[1].toString(36)}`;
    }
  } catch (err) {
    console.error(`${LOG_PREFIX}: secure ID generation failed; using timestamp only`, err);
  }
  return Date.now().toString(36);
}


function withSafeOnClose(onClose: () => void): () => void {
  return (): void => {
    try {
      onClose();
    } catch (err) {
      console.error(`${LOG_PREFIX}: onClose handler threw`, err);
    }
  };
}

function openDialog(dlg: HTMLDialogElement): void {
  try {
    if (dlg.open) return;
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
      return;
    }
    console.warn(`${LOG_PREFIX}: showModal() not supported; using open attribute`);
    dlg.setAttribute('open', 'true');
  } catch (err) {
    console.error(`${LOG_PREFIX}: failed to show modal`, err);
  }
}

function closeDialogIfOpen(dlg: HTMLDialogElement): void {
  if (!dlg.open) return;
  try {
    dlg.close();
  } catch (err) {
    console.warn(`${LOG_PREFIX}: close() failed; removing open attribute`, err);
    try {
      dlg.removeAttribute('open');
    } catch (innerErr) {
      console.error(`${LOG_PREFIX}: failed to remove open attribute`, innerErr);
    }
  }
}

function focusDialogNextTick(dlg: HTMLDialogElement): void {
  try {
    requestAnimationFrame((): void => {
      try {
        dlg.focus();
      } catch (err) {
        console.warn(`${LOG_PREFIX}: focusing dialog failed`, err);
      }
    });
  } catch (err) {
    console.warn(`${LOG_PREFIX}: requestAnimationFrame failed`, err);
  }
}

function getPortalTarget(): HTMLElement | null {
  try {
    return document?.body ?? null;
  } catch (err) {
    console.error(`${LOG_PREFIX}: accessing document.body failed`, err);
    return null;
  }
}

export default function DescriptionModal({
                                           open,
                                           title,
                                           onClose,
                                           children,
                                         }: Readonly<DescriptionModalProps>): React.ReactElement | null {
  const panelRef: RefObject<HTMLDialogElement | null> = useRef<HTMLDialogElement | null>(null);
  const titleId: string = useRef(`dialog-title-${safeId()}`).current;
  const safeOnClose: () => void = withSafeOnClose(onClose);

  useEffect((): (() => void) | undefined => {
    if (!open) return;
    let prev: string | null = null;
    try {
      prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
    } catch (err) {
      console.error(`${LOG_PREFIX}: failed to lock background scroll`, err);
    }
    return (): void => {
      try {
        if (prev !== null) document.documentElement.style.overflow = prev;
      } catch (err) {
        console.error(`${LOG_PREFIX}: failed to restore background scroll`, err);
      }
    };
  }, [open]);

  useEffect((): (() => void) | undefined => {
    const dlg: HTMLDialogElement | null = panelRef.current;
    if (!dlg) return;

    if (!open) {
      closeDialogIfOpen(dlg);
      return;
    }

    const handleCancel: (e: Event) => void = (e: Event): void => {
      try {
        e.preventDefault();
        safeOnClose();
      } catch (err) {
        console.error(`${LOG_PREFIX}: cancel handler failed`, err);
      }
    };
    const handleClose: () => void = (): void => { safeOnClose(); };

    try {
      dlg.addEventListener('cancel', handleCancel);
      dlg.addEventListener('close', handleClose);
    } catch (err) {
      console.error(`${LOG_PREFIX}: failed to attach dialog listeners`, err);
    }

    openDialog(dlg);
    focusDialogNextTick(dlg);

    return (): void => {
      try {
        dlg.removeEventListener('cancel', handleCancel);
        dlg.removeEventListener('close', handleClose);
      } catch (err) {
        console.error(`${LOG_PREFIX}: failed to detach dialog listeners`, err);
      }
    };
  }, [open, safeOnClose]);

  useEffect((): (() => void) | undefined => {
    if (!open) return;

    const onKey: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
      try {
        if (e.key === 'Escape') safeOnClose();
      } catch (err) {
        console.error(`${LOG_PREFIX}: ESC key handler failed`, err);
      }
    };

    try {
      window.addEventListener('keydown', onKey);
    } catch (err) {
      console.error(`${LOG_PREFIX}: failed to attach keydown listener`, err);
    }

    return (): void => {
      try {
        window.removeEventListener('keydown', onKey);
      } catch (err) {
        console.error(`${LOG_PREFIX}: failed to detach keydown listener`, err);
      }
    };
  }, [open, safeOnClose]);

  if (!open) return null;

  const onBackdropClick: () => void = (): void => { safeOnClose(); };
  const onBackdropKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    try {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        safeOnClose();
      }
    } catch (err) {
      console.error(`${LOG_PREFIX}: backdrop keydown onClose failed`, err);
    }
  };

  const portalTarget: HTMLElement | null = getPortalTarget();
  if (!portalTarget) {
    console.error(`${LOG_PREFIX}: document.body is unavailable; skipping render`);
    return null;
  }

  try {
    return createPortal(
      <DescriptionModalView
        title={title}
        titleId={titleId}
        onClose={safeOnClose}
        onBackdropClick={onBackdropClick}
        onBackdropKeyDown={onBackdropKeyDown}
        panelRef={panelRef}
      >
        {children}
      </DescriptionModalView>,
      portalTarget
    );
  } catch (err) {
    console.error(`${LOG_PREFIX}: rendering portal failed`, err);
    return null;
  }
}
