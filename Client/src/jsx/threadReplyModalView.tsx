import React, { type ChangeEvent } from 'react';
import { X } from 'lucide-react';
import {useScrollLock} from "../hooks/useScrollLock.ts";

type HeaderInfo = {
  projectType: string;
  customerName: string;
  businessName: string;
  statusLabel: string;
  statusClass: string;
  placedAt: string;
  orderId: number;
};

type ThreadMessage = {
  id: string;
  user: string;
  timestamp: string;
  message: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  header: HeaderInfo;
  messages: ThreadMessage[];
  reply: string;
  onChangeReply: (v: string) => void;
  onSend: () => Promise<void>;
  sending: boolean;
}

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-4 sm:px-0"
      aria-labelledby="thread-modal-title"
      role="text"
      aria-modal="true"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-hidden="false"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      {/* panel */}
      <div className="relative w-full sm:max-w-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-t-2xl sm:rounded-2xl shadow-[0_6px_24px_0_var(--theme-shadow)] overflow-hidden max-h-[90svh] flex flex-col">
        {/* header */}
        <div className="p-4 sm:p-6 border-b border-[var(--theme-border-red)]/30 bg-[var(--theme-surface)] flex justify-between items-start">
          <div>
            <h2 id="thread-modal-title" className="text-lg sm:text-xl font-bold">
              {header.projectType}
            </h2>
            <p className="text-xs sm:text-sm">
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
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        </div>

        {/* messages (scrollable) */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 grow min-h-0 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 italic">No messages yet.</p>
          )}

          {messages.map((m) => (
            <div key={m.id} className="relative pl-4 py-3 border-l-2 border-[var(--theme-border-red)]/30">
              <div className="absolute -left-[7px] top-3 w-3 h-3 rounded-full bg-[var(--theme-border-red)]" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{m.user}</p>
                <p className="text-[11px] text-gray-500">
                  {new Date(m.timestamp).toLocaleString()}
                </p>
                <p className="text-sm">{m.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="border-t border-[var(--theme-border-red)]/30 bg-[var(--theme-surface)] p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="thread-reply" className="text-sm">
              Reply
            </label>
            <textarea
              id="thread-reply"
              value={reply}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>): void =>
                onChangeReply(e.target.value)
              }
              placeholder="Type your message…"
              className="min-h-[96px] rounded-xl border border-[var(--theme-border-red)]/30 bg-transparent p-3 text-base sm:text-sm outline-none overflow-y-auto resize-none"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
              <div className="space-y-5 sm:space-y-0 sm:space-x-5 sm:flex-grow">
                <button
                  onClick={(): void => {
                    void onSend();
                  }}
                  disabled={sending || reply.trim().length === 0}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg text-base sm:text-sm bg-[var(--theme-button)] text-[var(--theme-text-white)] shadow-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 min-h-[44px]"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-lg text-base sm:text-sm border border-[var(--theme-border)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
