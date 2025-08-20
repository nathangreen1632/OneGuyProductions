import React, { useState, useEffect, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import AdminComposerView from '../../jsx/admin/adminComposerView';

interface AdminComposerProps {
  disabled: boolean;
  onSend: (body: string, requiresResponse: boolean) => Promise<boolean>;
}

export default function AdminComposer({
                                        disabled,
                                        onSend,
                                      }: Readonly<AdminComposerProps>): React.ReactElement {
  const [body, setBody] = useState<string>('');
  const [requires, setRequires] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect((): void => {
    if (typeof onSend !== 'function') {
      console.error('AdminComposer: onSend prop is not a function.');
      toast.error('AdminComposer: invalid onSend handler');
    }
  }, [onSend]);

  useEffect((): (() => void) | undefined => {
    try {
      if (!cooldown || cooldown <= 0) return;
      const t: number = window.setInterval((): void => {
        try {
          setCooldown((c: number): number => (Number.isFinite(c) && c > 0 ? c - 1 : 0));
        } catch (err) {
          console.error('AdminComposer: error updating cooldown.', err);
          toast.error('AdminComposer: cooldown update error');
        }
      }, 1000);
      return (): void => {
        try {
          window.clearInterval(t);
        } catch (err) {
          console.warn('AdminComposer: failed to clear cooldown timer.', err);
          toast.error('AdminComposer: cooldown cleanup warning');
        }
      };
    } catch (err) {
      console.error('AdminComposer: error starting cooldown timer.', err);
      toast.error('AdminComposer: cooldown init error');
      return;
    }
  }, [cooldown]);

  const handleBodyChange: (e: ChangeEvent<HTMLTextAreaElement>) => void = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    try {
      const next: string = e?.target?.value ?? '';
      setBody(String(next));
    } catch (err) {
      console.error('AdminComposer: body change handler error.', err);
      toast.error('AdminComposer: error updating message');
    }
  };

  const handleRequiresChange: (e: ChangeEvent<HTMLInputElement>) => void = (e: ChangeEvent<HTMLInputElement>): void => {
    try {
      const next: boolean = Boolean(e?.target?.checked);
      setRequires(next);
    } catch (err) {
      console.error('AdminComposer: requires change handler error.', err);
      toast.error('AdminComposer: error toggling response flag');
    }
  };

  const handleSendClick: () => Promise<void> = async (): Promise<void> => {
    try {
      if (disabled) {
        console.warn('AdminComposer: send attempted while disabled.');
        toast.error('AdminComposer: sending is currently disabled');
        return;
      }
      if (typeof onSend !== 'function') {
        console.error('AdminComposer: onSend is not callable.');
        toast.error('AdminComposer: cannot send right now');
        return;
      }

      const trimmed: string = (body ?? '').trim();
      if (!trimmed) {
        console.warn('AdminComposer: empty message blocked.');
        toast.error('Please enter a message before sending');
        return;
      }

      let ok: boolean;
      try {
        ok = Boolean(await onSend(trimmed, Boolean(requires)));
      } catch (err) {
        console.error('AdminComposer: onSend threw an error.', err);
        toast.error('Failed to send message');
        ok = false;
      }

      if (ok) {
        setBody('');
        setRequires(false);
        setCooldown(0);
      } else {
        console.warn('AdminComposer: onSend returned false.');
        toast.error('Message not sent');
      }
    } catch (err) {
      console.error('AdminComposer: unexpected error in send handler.', err);
      toast.error('Unexpected error while sending');
    }
  };

  return (
    <AdminComposerView
      disabled={Boolean(disabled)}
      body={body ?? ''}
      requires={Boolean(requires)}
      cooldown={Number.isFinite(cooldown) ? cooldown : 0}
      onBodyChange={handleBodyChange}
      onRequiresChange={handleRequiresChange}
      onSendClick={handleSendClick}
    />
  );
}
