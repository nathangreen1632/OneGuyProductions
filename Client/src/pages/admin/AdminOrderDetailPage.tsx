import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminTimeline from '../../components/admin/AdminTimeline';
import AdminStatusChips from '../../components/admin/AdminStatusChips';
import AdminComposer from '../../components/admin/AdminComposer';
import { useAdminStore } from '../../store/useAdminStore.ts';
import type { OrderThreadDto } from '../../types/admin.types.ts';

export default function AdminOrderDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const orderId: number = Number(id ?? NaN);
  const nav = useNavigate();

  const { threads, fetchThread, sendUpdate } = useAdminStore();
  const data: OrderThreadDto | undefined =
    Number.isFinite(orderId)
      ? (threads[orderId] ?? (threads as any)[String(orderId)])
      : undefined;

  const [sending, setSending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!data);

  useEffect((): () => void => {
    let active = true;
    (async (): Promise<void> => {
      if (!Number.isFinite(orderId) || orderId <= 0) return;
      if (!data) {
        setLoading(true);
        try { await fetchThread(orderId); }
        finally { if (active) setLoading(false); }
      }
    })();
    return (): void => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, fetchThread]);

  // Bad or missing id
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
        <span className="text-[var(--theme-border-red)]">Invalid order id.</span>
      </div>
    );
  }

  // Initial load
  if (loading && !data) {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--theme-card)]/60" />
        <div className="mt-3 h-3 w-48 animate-pulse rounded bg-[var(--theme-card)]/40" />
      </div>
    );
  }

  // Not found / empty payload
  if (!data?.order) {
    return (
      <div className="rounded-2xl bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-text)] shadow-[0_4px_14px_0_var(--theme-shadow)]">
        <span>Could not load this order.</span>
        <button
          className="ml-3 inline-flex items-center rounded-2xl px-3 py-1 text-[var(--theme-text)] transition hover:bg-[var(--theme-card-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30"
          onClick={() => nav('/admin/orders')}
        >
          Back to orders
        </button>
      </div>
    );
  }

  const canPost: boolean = data.canPost;

  return (
    <div className="grid gap-4 md:grid-cols-5 text-[var(--theme-text)]">
      {/* Timeline Panel */}
      <section
        className="
          md:col-span-3 rounded-2xl
          bg-[var(--theme-bg)]
          shadow-[0_4px_14px_0_var(--theme-shadow)]
          transition-colors duration-200
          p-3 sm:p-4
        "
      >
        <div className="mb-3 h-0.5 w-full"/>
        <AdminTimeline updates={data.updates ?? []} />
      </section>

      {/* Right Rail */}
      <aside className="md:col-span-2 space-y-3">
        {/* Status Card */}
        <div
          className="
            rounded-2xl
            bg-[var(--theme-surface)]
            shadow-[0_4px_14px_0_var(--theme-shadow)]
            p-3 sm:p-4
          "
        >
          <AdminStatusChips orderId={data.order.id} status={data.order.status} />
        </div>

        {/* Composer Card */}
        <div
          className="
            rounded-2xl
            bg-[var(--theme-bg)]
            shadow-[0_4px_14px_0_var(--theme-shadow)]
            p-3 sm:p-4
            transition-colors duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--theme-focus)]/30
          "
        >
          <AdminComposer
            disabled={!canPost || sending}
            onSend={async (body: string, requiresResponse: boolean): Promise<boolean> => {
              setSending(true);
              const ok: boolean = await sendUpdate(orderId, body, requiresResponse);
              setSending(false);
              return ok;
            }}
          />
          {!canPost && (
            <p className="mt-2 text-xs text-[var(--theme-text)]/70">
              Composer disabled for completed/cancelled orders.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
