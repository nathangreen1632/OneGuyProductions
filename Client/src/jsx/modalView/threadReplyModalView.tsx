import React, { type ChangeEvent } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock.ts';
import type { Props, ThreadMessage } from '../../types/modal.types.ts';

export default function ThreadReplyModalView(
  props: Readonly<Props>
): React.ReactElement | null {
  useScrollLock(true);

  const {
    isOpen, onClose, header, messages, reply, onChangeReply, onSend, sending,
  } = props;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0"
      aria-labelledby="thread-modal-title"
      role="text"
      aria-modal="true"
    >
      <button
        type="button"
        aria-hidden="false"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative w-full sm:max-w-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-2xl shadow-[0_6px_24px_0_var(--theme-shadow)] overflow-hidden max-h-[90svh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-[var(--theme-border-red)]/30 bg-[var(--theme-surface)] flex items-center justify-between">
          <div className="min-w-0">
            <h2 id="thread-modal-title" className="text-lg sm:text-xl font-semibold truncate">
              {header.projectType}
            </h2>
            <p className="text-xs sm:text-sm truncate">
              {header.customerName}
              {header.businessName ? ` • ${header.businessName}` : ''}
            </p>
            <p className={`text-xs font-semibold mt-1 ${header.statusClass}`}>
              {header.statusLabel}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              Placed: {header.placedAt} • Order #{header.orderId}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-[var(--theme-border-red)] hover:text-[var(--theme-border-red)]/80 cursor-pointer" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pr-1 -mr-1 custom-scrollbar">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 italic">No messages yet.</p>
          )}

          {messages.map((m: ThreadMessage): React.ReactElement => (
            <div key={m.id} className="relative pl-4 py-3 border-l-2 border-[var(--theme-border-red)]/30">
              <div className="absolute -left-[7px] top-3 w-3 h-3 rounded-full bg-[var(--theme-border-red)]" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{m.user}</p>
                <p className="text-[11px] text-gray-500">
                  {new Date(m.timestamp).toLocaleString()}
                </p>
                <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--theme-border-red)]/30 p-4 sm:p-6 bg-[var(--theme-surface)]">
          <div className="flex flex-col gap-2">
            <label htmlFor="thread-reply" className="text-sm">
              Reply
            </label>
            <textarea
              id="thread-reply"
              value={reply}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => onChangeReply(e.target.value)}
              placeholder="Type your message…"
              className="min-h-[96px] rounded-xl border border-[var(--theme-border-red)]/30 bg-[var(--theme-surface)] p-3 text-base sm:text-sm outline-none overflow-y-auto resize-none"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
              <button
                onClick={(): void => { void onSend(); }}
                disabled={sending || reply.trim().length === 0}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg text-base sm:text-sm bg-[var(--theme-button)] text-[var(--theme-text-white)] shadow-md disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px] cursor-pointer"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg bg-[var(--theme-button-red)] hover:bg-[var(--theme-button-red)]/80 text-base sm:text-sm min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
