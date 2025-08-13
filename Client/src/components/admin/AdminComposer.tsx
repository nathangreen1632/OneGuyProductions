import React, { useState, useEffect, type ChangeEvent } from 'react';
import AdminComposerView from '../../jsx/admin/adminComposerView';

export default function AdminComposer({
                                        disabled,
                                        onSend,
                                      }: Readonly<{
  disabled: boolean;
  onSend: (body: string, requiresResponse: boolean) => Promise<boolean>;
}>): React.ReactElement {
  const [body, setBody] = useState<string>('');
  const [requires, setRequires] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect((): (() => void) | undefined => {
    if (cooldown <= 0) return;
    const t: number = window.setInterval((): void => {
      setCooldown((c: number): number => c - 1);
    }, 1000);
    return (): void => window.clearInterval(t);
  }, [cooldown]);

  const handleBodyChange: (e: ChangeEvent<HTMLTextAreaElement>) => void = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setBody(e.target.value);
  };

  const handleRequiresChange: (e: ChangeEvent<HTMLInputElement>) => void = (e: ChangeEvent<HTMLInputElement>): void => {
    setRequires(e.target.checked);
  };

  const handleSendClick = async (): Promise<void> => {
    const trimmed: string = body.trim();
    if (!trimmed) return;
    const ok: boolean = await onSend(trimmed, requires);
    if (ok) {
      setBody('');
      setRequires(false);
      setCooldown(0);
    }
  };

  return (
    <AdminComposerView
      disabled={disabled}
      body={body}
      requires={requires}
      cooldown={cooldown}
      onBodyChange={handleBodyChange}
      onRequiresChange={handleRequiresChange}
      onSendClick={handleSendClick}
    />
  );
}
