import React, { type ChangeEvent } from 'react';

interface AdminComposerViewProps {
  disabled: boolean;
  body: string;
  requires: boolean;
  cooldown: number;
  onBodyChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onRequiresChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSendClick: () => void;
}

export default function AdminComposerView({
                                            disabled,
                                            body,
                                            requires,
                                            cooldown,
                                            onBodyChange,
                                            onRequiresChange,
                                            onSendClick,
                                          }: Readonly<AdminComposerViewProps>): React.ReactElement {
  const canSubmit: boolean = !disabled && body.trim().length > 0 && cooldown === 0;

  return (
    <section className="space-y-4 text-[var(--theme-text)]">
      <textarea
        value={body}
        onChange={onBodyChange}
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
            onChange={onRequiresChange}
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
          onClick={onSendClick}
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
