import React, { useState, useEffect, type ChangeEvent } from 'react';

export default function AdminComposer({
                                        disabled,
                                        onSend,
                                      }: Readonly<{
  disabled: boolean;
  onSend: (body: string, requiresResponse: boolean) => Promise<boolean>;
}>): React.ReactElement {
  const [body, setBody] = useState('');
  const [requires, setRequires] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect((): (() => void) | undefined => {
    if (cooldown <= 0) return;
    const t: number = window.setInterval((): void => setCooldown((c: number): number => c - 1), 1000);
    return (): void => window.clearInterval(t);
  }, [cooldown]);

  const canSubmit: boolean = !disabled && body.trim().length > 0 && cooldown === 0;

  return (
    <section className="space-y-4 text-[var(--theme-text)]">
      <textarea
        value={body}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => setBody(e.target.value)}
        placeholder="Write an update…"
        className="
          w-full h-40
          px-4 py-3
          rounded-2xl
          bg-[var(--theme-surface)]
          text-[var(--theme-text)]
          placeholder:text-[var(--theme-text)]/60
          focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
          shadow-[0_4px_14px_0_var(--theme-shadow)]
          transition-colors
        "
      />

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex select-none items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requires}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setRequires(e.target.checked)}
            className="
              h-4 w-4 rounded
              accent-[var(--theme-button)]
              focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
            "
          />
          <span>Require customer response</span>
        </label>

        <button
          disabled={!canSubmit}
          onClick={async (): Promise<void> => {
            const ok: boolean = await onSend(body.trim(), requires);
            if (ok) {
              setBody('');
              setRequires(false);
              setCooldown(60); // UX rate limit: 1/min
            }
          }}
          className="
            w-fit
            bg-[var(--theme-button)]
            hover:bg-[var(--theme-hover)]
            text-[var(--theme-text-white)]
            font-semibold
            py-2 px-6
            rounded-2xl
            transition-all duration-150
            shadow-[0_4px_14px_0_var(--theme-shadow)]
            focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {cooldown > 0 ? `Wait ${cooldown}s` : 'Send'}
        </button>
      </div>

      {disabled && (
        <p className="text-xs text-[var(--theme-text)]/70">
          Composer disabled for completed/cancelled orders.
        </p>
      )}
    </section>
  );
}
