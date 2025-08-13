import React, {type ChangeEvent} from 'react';

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

export default function ThreadReplyModalView(props: Props): React.ReactElement | null {
  const {
    isOpen, onClose, header, messages, reply, onChangeReply, onSend, sending,
  } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        className="relative w-full p-4 sm:p-6 sm:max-w-2xl bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-t-2xl sm:rounded-2xl shadow-[0_6px_24px_0_var(--theme-shadow)] border border-[var(--theme-border)] "
        role="text"
        aria-modal="true"
        aria-labelledby="thread-modal-title"
      >
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
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
              className="shrink-0 rounded-lg px-3 py-1 text-sm border border-[var(--theme-border)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[45vh] overflow-y-auto pr-1 -mr-1">
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 italic">No messages yet.</p>
          )}

          {messages.map(m => (
            <div key={m.id} className="relative pl-4 py-3 border-l-2 border-[var(--theme-border)]">
              <div className="absolute -left-[7px] top-3 w-3 h-3 rounded-full bg-[var(--theme-border)]" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{m.user}</p>
                <p className="text-[11px] text-gray-500">{new Date(m.timestamp).toLocaleString()}</p>
                <p className="text-sm">{m.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="thread-reply" className="text-sm">Reply</label>
          <textarea
            id="thread-reply"
            value={reply}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>): void => onChangeReply(e.target.value)}
            placeholder="Type your message…"
            className="min-h-[96px] rounded-xl border border-[var(--theme-border-blue)] bg-transparent p-3 text-sm outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border border-[var(--theme-border)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
            >
              Cancel
            </button>
            <button
              onClick={(): void => { void onSend(); }}
              disabled={sending || reply.trim().length === 0}
              className="px-4 py-2 rounded-lg text-sm bg-[var(--theme-button)] text-[var(--theme-text-white)] shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/60"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
